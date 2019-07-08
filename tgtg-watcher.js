const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const fs = require('fs');
const { promisify } = require('util')

const base_url = "https://apptoogoodtogo.com/index.php/api_tgtg/";

const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)

const main = async () => {
  console.log('\n\n\n--------- TGTG WATCHER --------\n\n\n')

  const res = await readFileAsync('config.json');
  const config = JSON.parse(res);

  var email = config.TGTG_USER;
  var password = config.TGTG_PASSWORD;

  var base_headers = {
    'accept': 'application/json',
    'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
    'accept-language': 'fr-FR;q=1.0, en-FR;q=0.9',
    'user-agent': 'TGTG/' + config.ANDROID_APP_VERSION + ' (637) (Android/Unknown; Scale/3.00)',
  }

  // First, connect to TGTG
  console.log('-- Connect to ToGoodToGo --\n');

  var login = await fetch(base_url + 'login', {
    method: 'POST',
    headers: base_headers,
    body: "email=" + config.TGTG_USER + "&password=" + config.TGTG_PASSWORD
  });

  var json = await login.json();
  var user_id = json.user_id;
  var user_token = json.user_token;

  if (user_id == undefined) {
    console.log('Wrong credentials');
    return;
  }

  console.log("User id:" + user_id);
  console.log("User token:" + user_token + "\n\n");

  base_headers['authorization'] = Buffer.from(`ACCESS:${user_id}:${user_token}`).toString('base64');

  switch (process.argv[2]) {
    case "email":
      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.EMAIL_SENDER,
          pass: config.EMAIL_PASSWORD
        }
      });

      fs.exists('data.json', function(exists){
        if(!exists){
          fs.writeFile('data.json', '{}');
        }
      });

      var minutes = config.FREQUENCY, the_interval = minutes * 60 * 1000;

      if (minutes < 0.20) {
        console.log("Frequency too low. We don't want to DdoS here...");
        return;
      }

      setInterval(async () => {
        var dateTime = new Date().toLocaleString();
        console.log('[' + dateTime + '] Run');

        // Read the data file.
        fs.readFile('data.json', function readFileCallback(err, data) {
          if (err) {
            console.log(err);
            return;
          } else {
            timetable = JSON.parse(data);
          }
        });

        var response = await fetch(base_url + 'list_favorite_businessesv5', {
          method: 'POST',
          headers: base_headers,
          body: `user_id=${user_id}&user_token=${user_token}`,
        });

        var json = await response.json();

        for (const business of json.info) {
          send = false;
          if (business['todays_stock'] > 0) {
            if (!timetable.hasOwnProperty(business['id'])) {
              send = true;
            }
            else {
              // 6 hours later.
              if (Date.now() - parseInt(timetable[business['id']]) > (config.MIN_TIME_BETWEEN_MAIL * 60 * 1000)) {
                send = true;
              }
            }
            if (send) {
              console.log(business['business_name'], '\n');

              // Prepare the email.
              var mailOptions = {
                from: config.EMAIL_SENDER,
                to: config.EMAIL_RECIPIENTS,
                subject: '[TooGoodToGo] ' + business['business_name'],
                text: JSON.stringify(business, undefined, 2)
              };

              // Update the timetable.
              timetable[business['id']] = Date.now();

              // Send the email
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });
            }
          }
        }

        fs.writeFile("data.json", JSON.stringify(timetable), (error) => { /* handle error */ });
      }, the_interval);

      break;

    case "show":
    default:    
      // Simple display.

      // Get favourites from TGTG
      console.log('-- Retrieve favourites --\n');
      var response = await fetch(base_url + 'list_favorite_businessesv5', {
        method: 'POST',
        headers: base_headers,
        body: `user_id=${user_id}&user_token=${user_token}`,
      });

      var json = await response.json();

      var i = 1;
      for(const business of json.info) {
        var color = business['todays_stock'] > 0 ? "\x1b[32m" : "\x1b[31m";

        console.log(color, i + ": ", business['business_name']);
        i++;
      }
      break;

  }
}

main();
