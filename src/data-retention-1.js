import { checkForStoredToken, Output, Stringify } from './ref/functions.js';
import { dataExtractUpdate, fileTransferUpdate } from './ref/automation-studio.js';
import { formatDateMMDDYYYY, monthName } from './ref/date-stuff.js';
import { ConfigClass } from './config.js';

var c = new ConfigClass();
var config = c.prod();//dev or prod are the options

var dataExtensions = {
  log: "ENT.Monthly_Data_Retention_Log",//remove ENT if running from parent bu
  tokenstorage: "tokenstorage"
}

var accessToken = checkForStoredToken("Marketing Cloud",config,dataExtensions.tokenstorage);//ensure your DE exists before you use this and set name and Key to tokenstorage

var dataExtract1 = '393ad945-1a87-452f-b82f-bee892c477c2a';
var dataExtract2 = 'be6d2e7b-b5a3-413a-8273-1e0a3ff075c9';
var fileTransfer1 = '3ece1d53-9a98-4219-86da-5e49c6ad662e';
var fileTransfer2 = '73beda83-99e2-448d-aa5c-c80bec45c364';
var fileTransferLocationId = 'a7e56f79-dae9-49bf-8649-afbe846cb2d6';


var today = new Date();
  
// Step 1: get the previous month
// Setting day=0 gives us the "last day of the previous month"
var lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

var prevMonthDays = lastDayPrevMonth.getDate();
var prevMonthNum = lastDayPrevMonth.getMonth() + 1; // 1-based month
var prevMonth = monthName(prevMonthNum);
var prevYear = lastDayPrevMonth.getFullYear();
var mid = Platform.Recipient.GetAttributeValue('memberid'); 
var errorString = trackError();
//var dateString = formatDateMMDDYYYY(today);

function trackError(msg){
  if(msg === undefined){
    return '';
  }else{
    return "\r\n\r\n" + msg;
  }

}
    
/**
 * =============================
 * MAIN SCRIPT EXECUTION LOGIC
 * =============================
 *
 * This script automates the Marketing Cloud data retention process by:
 * 1. Checking if a data retention run has already been logged for the previous month.
 * 2. If not, initiating a new log entry in the Data Extension.
 * 3. Updating one or two Data Extract definitions (depending on the number of days in the previous month).
 * 4. Updating corresponding File Transfer activities with new filenames.
 * 5. Logging errors and success states to the Data Extension.
 *
 * The script dynamically determines the previous month’s date range,
 * generates appropriately named output files, and avoids duplicate runs
 * by verifying existing log entries before proceeding.
 */

try{

      //check if row exists, if it does, we stop because it's already been run
      var dataRows = Platform.Function.LookupRows(dataExtensions.log,['ForMonth','AccountID','Year'],[prevMonth, mid, prevYear]);
      if(dataRows && dataRows.length > 0) {
          for(var i=0; i<dataRows.length; i++) {
                Platform.Response.Write(dataRows[i]['Days'] + " " + dataRows[i]['LogDate'] + "<br/>");
          }
          //raise error and quit
            Platform.Function.RaiseError(
                "\r\n\r\n Error Date: " + today + ' : '+dataRows[0]['Error']+'Entry already exists. Check '+dataExtensions.log+' for details.',
                true,
                'Data Retention has already been run for this month.',
                100
            );       
        
      }
      
      //start by initiating log
      //WS Proxy doesn't work on Shared DE from child to parent
      
      logIt(['LogDate','Days'],[today,prevMonthDays]);
      //If there are more than 30 days last moth, we need to do two data extracts.
      //If the month is 30 days or less, we can do just one, so we set endDay equal to prevMonthDays

      var endDay = (prevMonthDays > 30) ? 15: prevMonthDays;
      var update1 = updateExtractAndFileTransfer(1, endDay, dataExtract1, fileTransfer1);
      if(update1.error){
        logIt(['Error'],[update1.msg]);
      }else{
        logIt(['DataExtract1_Updated','FileTransfer1_Updated'],[true,true]);
      }

      if (prevMonthDays > 30) {
        var update2 = updateExtractAndFileTransfer(16, 31,dataExtract2, fileTransfer2);
        if(update2.error){
          logIt(['Error'],[update2.msg]);
        }else{
          logIt(['DataExtract2_Updated','FileTransfer2_Updated'],[true,true]);
        }        
      }


    }catch(e){
      //Output('second message');
      //Output(Stringify(e));
      //Output("\r\n");
      
      logIt(['LogDate','Error'],[today,e.description]);
    }
/**
 * Inserts or updates a record in the log Data Extension with execution details.
 * Used to record timestamps, success states, or error messages during runtime.
 *
 * @param {Array<string>} columns - The names of the columns to update.
 * @param {Array<any>} values - The corresponding values to insert or update.
 */
function logIt(columns,values){
  Platform.Function.UpsertData(dataExtensions.log,['ForMonth','AccountID','Year'],[prevMonth,mid, prevYear],columns,values);
}
/**
 * Updates both a Data Extract and a File Transfer activity for a given date range.
 * Builds a descriptive filename, updates both objects, and logs errors if updates fail.
 *
 * @param {number} startDay - Starting day of the data extract range.
 * @param {number} endDay - Ending day of the data extract range.
 * @param {string} dataExtractId - The ID of the Data Extract definition.
 * @param {string} fileTransferId - The ID of the File Transfer definition.
 * @returns {object|undefined} An error object if a failure occurs, otherwise undefined on success.
 */

function updateExtractAndFileTransfer(startDay, endDay, dataExtractId, fileTransferId){
      var filename = 'DataRetention_'+prevMonth+'_'+startDay+'-'+endDay+'_'+prevYear+'.zip';
      
      var updateExtract = dataExtractUpdate(startDay, endDay, prevYear, prevMonthNum, accessToken, dataExtractId, config.mc.restURL, filename);
      
      if(!updateExtract.dataExtractDefinitionId){
        //Output(updateExtract);
        //Platform.Function.UpsertData(dataExtensions.log,['LogDate'],[today],['Script_1_DataExtract_Success'],[true]);
        return {error:true,msg:'Data Extract Update Failed. Verify Extract ID is correct'+dataExtractId + ' '+updateExtract};
      }

      var updateFileTransfer = fileTransferUpdate(config.mc.restURL, accessToken, {id:fileTransferId,filename:filename,fileTransferLocationId:fileTransferLocationId});
      
      if(!updateFileTransfer.id){
        //Output(updateFileTransfer);
        //log error
        return {error:true,msg:'File Transfer Update Failed. Verify File Transfer ID is correct'+fileTransferId + ' '+updateFileTransfer};
      }      

}
