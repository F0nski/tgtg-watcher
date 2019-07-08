# TooGoodToGo Watcher

## Introduction

**TooGoodToGo Watcher** is a simple NodeJS Tool to watch for your favourites in TooGoodToGo.

It uses the TGTG API to check your favourites, and send you an email (atm only through gmail) as soon as there is available stocks.

## Installation

Simply install NodeJS (see https://nodejs.org/en/download/) and run in your terminal :

```npm install```

Or if you have Yarn installed

```yarn install```

## Configuration

First of all, copy the `example_config.json` file to `config.json` and edit the configuration.

* `TGTG_USER`: Your TGTG username (or email)
* `TGTG_PASSWORD`: Your TGTG password
* `FREQUENCY`: The frequency at which you want to watcher to check your favourites (in minutes). Don't go below 0.25 to avoid DdoS...
* `EMAIL_SENDER`: The GMail account used to send mails
* `EMAIL_PASSWORD`: The GMail account application password (see https://support.google.com/mail/answer/185833)
* `EMAIL_RECIPIENTS`: The emails recipients (seperated by commas). You can just use the same as the email sender.
* `ANDROID_APP_VERSION`: The current Android APP version. If the app is updated, the TGTG watcher may not work, so you have to update this value.
* `MIN_TIME_BETWEEN_MAIL`: The minimum time between 2 emails for the same business (in minutes). For example, if you put 360, it will wait 6 hours before sending you an email notification (so you don't get spam by yourself...)

## Use

To ensure that everything is well configured, just go in the project's folder and type:

```node tgtg-watcher.js show```

If it shows your list of favourite, you're all good. Else, just check your configuration or the Android APP version number.

Then, and finally, to run the watcher, type:

```node tgtg-watcher.js email```
