Live Transaction is an NodeJS application that will allow you to have a web socket implementation for receiving
live transactions on the Feathercoin network. This is similar to Blockchain.info live transaction.

To push a new transaction to all connection clients visit URL/api?address={0}&amount={1}. Please note, you SHOULD 
limit access to the api to localhost or implement HMAC or a similar security protection to prevent false information being published.


This application is the basics of another application that I am using in the wild. My intent of releasing this application as opensource is to 
help other developers get an idea of how to implement this type of software.  I am planning on releasing the actual application that I use as open source in the very near future. 

(c) Michael Harrison 2014