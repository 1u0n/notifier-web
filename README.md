# NOTIFIER - WEB #

web app to create and manage agents that periodically watch other websites and send notifications using Server Side Events to your mobile phone (needs [notifier-app](https://github.com/1u0n/notifier-app)) when certain conditions occur 
 
 
**(examples) notify me when:**

- company A's stock value goes above X
- tomorrow's forecast changes from sunny to rainy
- certain website has news mentioning X
- ... anything you can think of ...

 
 
## Agents
your agents are composed of

- url
- css selector
- condition to send notification

notifier-web uses [x-ray](https://github.com/matthewmueller/x-ray) to scrap your websites. By default it gets the *innerText* of the selected element(s), and also allows to retrieve attribute values or inner html markup. Some examples of the css selector syntax:


selector | result
---|---
#someId a | `innerText` of the first `<a>` inside element with id 'someId'
table.main > tr@html | `innerHtml` of the first `<tr>` direct child of table with class 'main'
div[id*="main"]@class | `class` attribute of the `<div>` whose id contains 'main'
tr:contains(foo) td:nth-of-type(3) | `innerText` of the 3rd cell of the first row found containing 'foo'

## Use it
clone or download this repo, and:

```
npm install
npm start
```

~~Or if you just want to have a look, I try to keep the latest version running [here](http://128.199.150.245:3001/notifier). Log in with test/test to see some sample agents.~~


## Techs
- node
- express
- handlebars
- sqlite
- x-ray
- [sse-channel](https://github.com/rexxars/sse-channel)

## Disclaimer
This is just a test project for me to learn new stuff. Use it as you like and don't expect it to work flawlessly.
