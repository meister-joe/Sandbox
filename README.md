# Welcome to ONE Record Sandbox!
This repository contains the code and instructions that will help you deploy your first ONE Record Server. Please follow the instructions in order to get the application running.

# Configuration 
Before deploying the server, you will need to update the `config.js` file with the following information:
   
    'secretKey': 'somesecretkeyforJWTencryption'
    'mongoUrl': 'mongodb://user:password@url:port/database',
    'subscriptionSecret': 'yoursubscriptionsecret',
    'url':'yourbaseurl',
    'companyName': 'yourcompanyname',
    'IATACargoAgentCode': 'numericvalue',
    'cacheFor': 'numericvalueinseconds',
    'serverOwnSecret': 'secretNeededToAccessInternalResources',
    'keyForServerInformation': 'keyForAccessingServerInformationEndpoint'
|Parameter         | Description                   |
|------------------|-------------------------------|
|secretKey         |This key will be used for JWT encryption            |
|mongoUrl          |URL to your MongoDB database. Instructions on how to setup quickly a MongoDB environment below           |
|subscriptionSecret   |In a subscriber - publisher scenario, this key needs to be sent when your server subscribes to another server's logistics objects. The publisher can `POST` to`/callbackUrl` endpoint only if it has this key|
|url               |Base URL of your server in the Internet of Logistics|
|companyName       |Name of your company |
|IATACargoAgentCode|IATA Cargo Agent Code of your server |
|cacheFor          |Amount of time in seconds for which the subscription information can be cached |
|serverOwnSecret   |Secret needed to access internal endpoints |
|keyForServerInformation   |Key needed in order to access serverInformation endpoint |

# Local testing
For testing the application locally, follow the next steps:
1. Install `Node.js` and `npm`. Please refer to Node.js documentation in order to install the correct version for your operating system: [https://nodejs.org/en/download/](https://nodejs.org/en/download/). 
2. Install the dependencies in the local `node_modules` folder by running `npm install`.
3. Run the server via `npm start`. Your application should be available at [http://localhost:5000](http://localhost:5000).

## Swagger API Documentation
Swagger API Documentation can be accessed and tested via [http://yourserverbaseurl/api-docs/](http://yourserverbaseurl/api-docs/). If you run the server locally, Swagger documentation can be accessed via [http://localhost:5000/api-docs/](http://localhost:5000/api-docs/).

# Deployment
## MongoDB database
ONE Record Server uses a MongoDB database. In order to setup quickly your own MongoDB environment, we suggest you to use a cloud database service such as [mLab](https://mlab.com/home).

1. To get started with mLab, you must first [create your free mLab account](https://mlab.com/signup). When that’s complete, you can add as many database subscriptions as you want. 
2. After you’ve created your account,  [add a new database subscription](https://mlab.com/create/wizard). Get started at no cost by creating a free Sandbox database.
3. Create a database user and password and retrieve your connection info after logging into your account and navigating to the database’s home page:
![enter image description here](https://docs.mlab.com/assets/screenshot-connectinfo.png)
4. Add your database URL to `config.js` file: `'mongoUrl': 'mongodb://user:password@url:port/yourdb'`

## Heroku deployment
You can deploy the ONE Record server on the platform that you wish. We are providing you with simple steps to deploy the application on [Heroku platform](https://www.heroku.com/home). You can find the complete instructions on how to deploy a `Node.js` application on Heroku [here](https://devcenter.heroku.com/articles/deploying-nodejs).
1. Create a free [Heroku account](https://signup.heroku.com/signup/dc).
2. Download and install [Heroku CLI](https://cli.heroku.com/).
3. Login to Heroku via command line: `heroku login -i`
4. Checkout the Github repository
5. Create an app on Heroku via `heroku create`. The output of the command should look like:

> Creating app... done, ⬢ fathomless-escarpment-49684
> https://fathomless-escarpment-49684.herokuapp.com/ |
> https://git.heroku.com/fathomless-escarpment-49684.git

 You can now visualize your app via [your Heroku dashboard](https://dashboard.heroku.com/apps).

7. Add your Heroku remote as a remote in your current repository via the following command:
`heroku git:remote -a fathomless-escarpment-49684`
8. Push the code from the Github repository to newly created app: `git push heroku master`.
9. All set! Your server should be available at https://fathomless-escarpment-49684.herokuapp.com.

## Logistics Objects Examples
Some examples of logistics objects can be found under `/examples` folder.

## IATA ONE Record
You can find further information about ONE Record specifications [here](https://github.com/IATA-Cargo/ONE-Record).


