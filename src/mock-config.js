

export function ConfigClass(env){

  this.dev = function (){
    var config = {
      mc:{
          subdomain:'xxxxxxxxxxxx',
          clientid:'xxxxxxxxxxxx',
          clientsecret:'xxxxxxxxxxxx',
          mid:0123456,
          restURL:'https://xxxxxxxxxxxx.rest.marketingcloudapis.com/'
      },
      sf:{
        clientid:"xxxxxxxxxxxx",
        clientsecret:"xxxxxxxxxxxx",
        host:'https://xxxxxxxxxxxx.my.salesforce.com/',
        apiVersion:'64.0'
      }
    };
    return config;
  }


  this.prod = function (){
    var config = {
      mc:{
        subdomain:'xxxxxxxxxxxx',
        clientid:'xxxxxxxxxxxx',
        clientsecret:'xxxxxxxxxxxx',
        mid:0123456,
        restURL:'https://xxxxxxxxxxxx.rest.marketingcloudapis.com/'
    },
    sf:{
      clientid:'',
      clientsecret:'',
      host:''
    }
    };
    return config;
  }  
}



