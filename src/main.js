import { checkForStoredToken, Output, Stringify } from './functions.js';
import { getDERowsREST } from './data-extension.js';
import { getDE, LogClass } from './cd-functions.js';
import { authSF } from './salesforce.js';
import { openBulkReq, getBulkJobInfo } from './bulk-api.js';
import { ConfigClass } from './config.js';


    //var prox = new Script.Util.WSProxy();
    var guid = Platform.Function.GUID();

    var c = new ConfigClass();
    var config = c.dev();

    var dataExtensions = {
        log: "ContactDeleteAutomationLog",
        tokenstorage: "tokenstorage"
    }

    
try{

    var sourceDE = "Invalid_MDM_LPIDS_ACCTID_302_10000SD";//LabServEmailApptConfirmation_r2_fromDevDB";
    var req = getDE(sourceDE);

    //write initial row to log
    var log = new LogClass(dataExtensions.log);
        log.initLog(sourceDE,req.Results[0].CategoryID,guid);

    if(req.Results.length == 0){
        var errorMsg = "Data Extension Not found";
        log.error(errorMsg,guid);
        Platform.Function.RaiseError(errorMsg,false,"statusCode","3");
    }
    if(req.Results[0].IsSendable == false){
        var errorMsg = "Data Extension is not sendable, quitting...";
        log.error(errorMsg,guid);
        Platform.Function.RaiseError(errorMsg,false,"statusCode","3");
    }

  
    var accessToken = checkForStoredToken("Marketing Cloud",config,dataExtensions.tokenstorage);//ensure your DE exists before you use this and set name and Key to tokenstorage
   
    var data = getDERowsREST(sourceDE,config.mc.restURL,accessToken);

    Output(Stringify(data),5);

    if(data.length == 0){
        var errorMsg = "Data Extension has no data, quitting...";
        log.error(errorMsg,guid);
        Platform.Function.RaiseError(errorMsg,false,"statusCode","3");
    }else{
        var deleteCSV = "AccountID\r\n";
        for(var i = 0; i < data.length; i++){
            deleteCSV += data[i].keys.accountid;
            //deleteCSV += data[i].values.contactkey;
            deleteCSV += "\r\n";
        }
        Output(deleteCSV,3);
        //Proceed
        //format rows for bulk api


        // get SF access token
        //var sf = authSF(config.sf.host,config.sf.clientid,config.sf.clientsecret);
        //Output(Stringify(sf),3)

        //var sftoken = sf.access_token;
        //var instance = sf.instance_url;

        //var acctJob = openBulkReq(instance, sftoken, 'Account', 'delete',config.sf.apiVersion);
        //Output(Stringify(acctJob),3);

        //Write job to a DE


        //var batch = processBatch(instance, sftoken, acctJob.id, id, cols, vals);
        //var status = getBulkJobInfo(instance, sftoken, '750Ki000006XIKEIA4', config.sf.apiVersion);
        //Output(status);






        
        

    }

  
     
      


    }catch(e){
    
    Output(Stringify(e));
    Output("\r\n");

    }