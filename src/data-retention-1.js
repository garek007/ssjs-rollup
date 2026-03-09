/**
 * CHANGELOG
 * 2025-09-15: Started initial script
 * 2025-11-12: Tested code, added better error handling
 * 2025-12-02: Added new data extension for error logging. Using a single DE for all was getting confusing.
 */
import { checkForStoredToken, Output, Stringify } from './ref/functions.js';
import { dataExtractUpdate, fileTransferUpdate } from './ref/automation-studio.js';
import { formatDateMMDDYYYY, monthName } from './ref/date-stuff.js';
import { ConfigClass } from './config.js';

var c = new ConfigClass();
var config = c.prod();//dev or prod are the options

var dataExtensions = {
  log: "ENT.Monthly_Data_Retention_Log",//remove ENT if running from parent bu
  errorlog: "ENT.Monthly_Data_Retention_Error_Log",
  tokenstorage: "tokenstorage"
}

var accessToken = checkForStoredToken("Marketing Cloud",config,dataExtensions.tokenstorage);//ensure your DE exists before you use this and set name and Key to tokenstorage

/**
 * Note that in error handling testing, I changed these on purpose
 * to cause an error. Look at the comment beside each. 
 * If the string doesn't end with the number specified, trim off the 
 * last character. 
 */
var dataExtract1 = '393ad945-1a87-452f-b82f-bee892c477c2';//should end with 2
var dataExtract2 = 'be6d2e7b-b5a3-413a-8273-1e0a3ff075c9';//should end with 9
var fileTransfer1 = '3ece1d53-9a98-4219-86da-5e49c6ad662e';//should end with e
var fileTransfer2 = '73beda83-99e2-448d-aa5c-c80bec45c364';//should end with 4
var fileTransferLocationId = 'a7e56f79-dae9-49bf-8649-afbe846cb2d6';//should end with 6


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
              "\r\n\r\n Error Date: " + today + ' : '+dataRows[0]['Error']+'Entry already exists. Check '+dataExtensions.errorlog+' for details.',
              true,
              'Data Retention has already been run for this month.',
              100
          );       
      
    }

    //start by initiating log
    //WS Proxy doesn't work on Shared DE from child to parent
      
    logIt(['LogDate','Days'],[today,prevMonthDays],0);
    //If there are more than 30 days last moth, we need to do two data extracts.
    //If the month is 30 days or less, we can do just one, so we set endDay equal to prevMonthDays



     // var startDateTime = month+'/'+startDay+'/'+year+' 12:00:00 AM';
    //  var endDateTime = month+'/'+endDay+'/'+year+' 12:00:00 AM';
    function calculateDateRange(startDay,endDay,monthNumber,year){
        var dateObj = {};
            dateObj.start = monthNumber+'/'+startDay+'/'+year+' 12:00:00 AM';
            dateObj.filename = 'DataRetention_'+monthName(monthNumber)+'_'+startDay+'-'+endDay+'_'+year+'.zip'

        if(endDay == 28 || endDay == 29 || endDay == 30){
            //if endDay is 28, 29 or 30, we'll use the first of the next month
            dateObj.end = Number(monthNumber+1)+'/1/'+year+' 12:00:00 AM';
        }else{
            if(startDay == 16){
                dateObj.end = Number(monthNumber+1)+'/1/'+year+' 12:00:00 AM';
            }else{
                dateObj.end = monthNumber+'/16/'+year+' 12:00:00 AM';
            }
        }
        return dateObj;
    }

    

    var dateRange = calculateDateRange(1, prevMonthDays,prevMonthNum,prevYear);
    
    Output(dateRange.start,2);
    Output(dateRange.end,2);
    Output(dateRange.filename,3);

    

      var update1 = updateExtractAndFileTransfer(dateRange.start, dateRange.end, dataExtract1, fileTransfer1,dateRange.filename);
      if(update1.error){
        logIt(['Error'],[update1.msg],1);
      }else{
        logIt(['DataExtract1_Updated','FileTransfer1_Updated'],[true,true],0);
      }

      if (prevMonthDays > 30) {
        var dateRange = calculateDateRange(16, prevMonthDays,prevMonthNum,prevYear);
        var update2 = updateExtractAndFileTransfer(dateRange.start, dateRange.end, dataExtract2, fileTransfer2,dateRange.filename);
        if(update2.error){
          logIt(['Error'],[update2.msg],1);
        }else{
          logIt(['DataExtract2_Updated','FileTransfer2_Updated'],[true,true],0);
        }        
      }    


    }catch(e){
      //Output('second message');
      //Output(Stringify(e));
      //Output("\r\n");
      
      logIt(['LogDate','Error'],[today,e.description],1);
    }
/**
 * Inserts or updates a record in the log Data Extension with execution details.
 * Used to record timestamps, success states, or error messages during runtime.
 *
 * @param {Array<string>} columns - The names of the columns to update.
 * @param {Array<any>} values - The corresponding values to insert or update.
 */
function logIt(columns,values,errorFlag){
  var logDefaultKeys = ['ForMonth','AccountID','Year'];
  var logDefaultVals = [prevMonth,mid, prevYear];
  var mergedKeys = logDefaultKeys.concat(columns); //for the InsertData call which has a different structure
  var mergedVals = logDefaultVals.concat(values);
  if(errorFlag == 1){
    Platform.Function.InsertData(dataExtensions.errorlog,mergedKeys,mergedVals);
  }else{
    Platform.Function.UpsertData(dataExtensions.log,logDefaultKeys,logDefaultVals,columns,values);
  }
    
}
/**
 * Updates both a Data Extract and a File Transfer activity for a given date range.
 * Builds a descriptive filename, updates both objects, and logs errors if updates fail.
 *
 * @param {string} start - Starting date with time of the data extract range.
 * @param {string} end - Ending date with time of the data extract range.
 * @param {string} dataExtractId - The ID of the Data Extract definition.
 * @param {string} fileTransferId - The ID of the File Transfer definition.
 * @returns {object|undefined} An error object if a failure occurs, otherwise undefined on success.
 */

function updateExtractAndFileTransfer(start, end, dataExtractId, fileTransferId,filename){
      
      var updateExtract = dataExtractUpdate(start, end, accessToken, dataExtractId, config.mc.restURL, filename);
      
      if(!updateExtract.dataExtractDefinitionId){
        //Output(updateExtract);
        //Platform.Function.UpsertData(dataExtensions.log,['LogDate'],[today],['Script_1_DataExtract_Success'],[true]);
        
        var mObj = {};
            mObj.msg = 'Data Extract Update Failed. Verify Extract ID is correct: '+dataExtractId;
            mObj.startDay = startDay;
            mObj.endDay = endDay;
            mObj.prevYear = prevYear;
            mObj.prevMonth = prevMonth;

        return {error:true,msg:Stringify(mObj)+"\r\n"+updateExtract};        
      }

      var updateFileTransfer = fileTransferUpdate(config.mc.restURL, accessToken, {id:fileTransferId,filename:filename,fileTransferLocationId:fileTransferLocationId});
      
      if(!updateFileTransfer.id){
        //Output(updateFileTransfer);
        //log error
        return {error:true,msg:'File Transfer Update Failed. Verify File Transfer ID is correct'+fileTransferId + ' '+updateFileTransfer};
      }      

}
