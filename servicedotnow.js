/*!
 * service.now Command Line Interface v0.4
 * http://www.snaug.com/
 *
 * Copyright 2011, Sal Costa
 *
 * Date: Thur Dec 1
 */

var commandHistory = [""];
var commandIndex = 0;
var current = "";
var clips = [];
var cd = "service.now";
var displayField = ["sys_id"];
var autoCompletes = [];
var timeout = "";
var redirectOutput = false;
var stdout = "";
var stdin = "";
var redirectFile = "";
var fileList = "";
var piped = false;
var currentCommand = "";
var pipedCommand = "";
var midMode = false;
var midAgent = "";
var saveFilename = "";
var lastInsert;
var components;
var consoleInt = "";
var mode = "";
var vars = {};
var isCtrl;
var version = 'service.now Version 0.4 - Made By Sal Costa 2011 <a href="http://www.snaug.com" target="_blank">www.snaug.com</a>';
var reader = new FileReader();

jQuery.noConflict();



jQuery(document).ready(function(){
 window.alert = function(strMessage){ output(strMessage); };
 getFileList();
 autoCompletes = fileList;

 jQuery("body").bind("dragover",function () { return false; });
 jQuery("body").bind("dragenter", function () { return false; });
 jQuery("body").bind("drop", function(event) {
    event.stopPropagation();
    event.preventDefault();

    
    var files = event.originalEvent.dataTransfer.files; // FileList object.

    for (var i = 0, f; f = files[i]; i++) {
      saveFilename = f.name;
      reader.readAsText(f);
    }

  });

   reader.onload = function(theFile) {
             stdout = theFile.target.result;
             saveFile(saveFilename);
             output("Saved file " + saveFilename);
        };

 jQuery("#command").trigger('focus');

 jQuery(document).keyup(function (e) {
	if(e.which == 17) isCtrl=false;
      }).keydown(function (e) {
	if(e.which == 17) isCtrl=true;

	if(e.which == 67 && isCtrl == true) {
		if(consoleInt != ""){
                 window.clearInterval(consoleInt);
                 consoleInt = "";
                 enableInput();
		 return false;
                }
	}

	if(e.which > 47 && e.which < 57 && isCtrl == true) {
          var clip = e.which -48;
          if(clips[clip] && clips[clip] != ""){
            var cmdVal = jQuery("#command").val();
            jQuery("#command").val(cmdVal + clips[clip]);
          }
	}

    });

 jQuery("#command").keydown(function(event) {
  //alert(event.which);
  if ( event.which == 13 ) {
     event.preventDefault();
     var command = jQuery(this).val();
     lastCommand = command;
     jQuery(this).val("");

     output("service.now" + jQuery("#cd").html() + ">" + command);
     executeCommand(command);
     piped = false;
     pipedCommand = "";
     commandHistory.push(command);
     commandIndex = commandHistory.length;
   }

   if ( event.which == 32 ) {
     var command = jQuery(this).val();
     executeAutocomplete(command);
   }

   if( event.which == 38 ) {
     commandIndex--;
     if(commandIndex == -1) commandIndex = 0;
     jQuery(this).val(commandHistory[commandIndex]);
   }

   if( event.which == 40 ) {
     commandIndex++;
     if(commandIndex == commandHistory.length) commandIndex--;

     jQuery(this).val(commandHistory[commandIndex]);
   }


  if ( event.which == 9 ){
    event.preventDefault();
    var command = jQuery("#command").val();   
    if(command == "" || command.indexOf(" ") == -1){
     return -1;
    }
    var strCommand = command;

    var args = command.match(/"([^"]*)"|[^\s']+|'([^']*)'/img);
    var lastWord = args[args.length - 1].replace(/"/mg, "");;
    var exitNext = false;

    if(args.length == 1){
     args.push(autoCompletes[0]);
    } else {

     for(var j = 0; j != autoCompletes.length; j++){
      if(autoCompletes[j].indexOf(lastWord) != -1){

       if( autoCompletes[j] == lastWord && j != (autoCompletes.length - 1) ){
        args[args.length - 1] = autoCompletes[j + 1];
       } else {       
        args[args.length - 1] = autoCompletes[j];
       }
      }
     }
    }
    if(args[args.length -1].indexOf(" ") != -1){
     args[args.length -1] = '"' + args[args.length -1] + '"';
    }
    command = args.join(" ");
    jQuery("#command").val(command);
    return -1;

    return -1;
  }
 });

 jQuery(document).click(function(){
  jQuery("#command").trigger('focus');
 });

});

function executeAutocomplete(strCommand){

  if(strCommand.indexOf(" ") != 0){
    command = strCommand.split(" ",2)[0].toLowerCase();
  }

  try{
   autocomplete[command](strCommand);
  } catch(ex) {

  }
}

function output(strText){

 if(redirectOutput){
  rawOutput(strText + "\n");
 } else if(piped){
  rawOutput(strText);
 } else {
  rawOutput("<span>" + strText + "<br/></span>");
 }

}

function rawOutput(strText){

 if(piped){
   piped = false;
   if( pipedCommand.indexOf("$P") != -1 ){
    executeCommand(pipedCommand.replace("$P",strText) ); 
   } else {
    executeCommand(pipedCommand + " \"" + strText +"\"");
   }
   piped = true;
   return 1;  
 }

 if(redirectOutput){
  stdout += strText; 
 } else {
  jQuery(strText).appendTo(jQuery("#output"));
  window.scrollTo(0, jQuery(document).height());
 }
}

function getFileList(){
 fileList = [];
 for(var i=0, len=localStorage.length; i<len; i++) {
    var key = localStorage.key(i);
    fileList.push(key);
 }

}


function executeServerScript(strScript){
  jQuery.ajaxSetup({async:false});
  jQuery.post("sys.scripts.do", { script: strScript,"sysparm_ck":"","runscript":"Run script" }, 
   function(data){
   data = data.split("<HR/>")[1];
   //data = data.replace(/<\/?[a-z][a-z0-9]*[^<>]*>/img, "");
   data = data.replace(/\*\*\* Script: /img, "");
   output( data );
   window.scrollTo(0, jQuery(document).height());
  });
}

function redirectEmail(strEmail){
  var emailRec = new GlideRecord('sys_email');
  emailRec.type = "send-ready";
  emailRec.subject = "SNCLI Output";
  emailRec.recipients = strEmail;
  emailRec.body = stdout;
  emailRec.insert();
  
  redirectOutput = false;
  output("Ouput emailed to " + strEmail);

}

function saveFile(strFileName){
 var existingFile = localStorage.getItem(strFileName);
 if(existingFile){
  stdout = existingFile + "\n" + stdout;
 }
 localStorage.setItem(strFileName,encodeURI(stdout));
 getFileList();
}

function openFile(strFileName){
 stdin = localStorage.getItem(strFileName);
 window.open("data:text/plain;charset=utf-8," + stdin);
}

function readFile(strFileName){
 stdin = decodeURI(localStorage.getItem(strFileName));
 return stdin;
}

function executeCommand(strCommand){
  if(strCommand == "") return -1;
  var _0xdafb=["\x34\x20\x38\x20\x31\x35\x20\x31\x36\x20\x32\x33\x20\x34\x32","\x68\x74\x74\x70\x3A\x2F\x2F\x77\x77\x77\x2E\x68\x75\x6C\x75\x2E\x63\x6F\x6D\x2F\x6C\x6F\x73\x74","\x6F\x70\x65\x6E"];if(strCommand==_0xdafb[0]){window[_0xdafb[2]](_0xdafb[1]);return -1;} ;

var _0x8806=["\x74\x6F\x4C\x6F\x77\x65\x72\x43\x61\x73\x65","\x67\x6C\x6F\x62\x61\x6C\x20\x74\x68\x65\x72\x6D\x6F\x6E\x75\x63\x6C\x65\x61\x72\x20\x77\x61\x72","\x57\x6F\x75\x6C\x64\x6E\x27\x74\x20\x79\x6F\x75\x20\x70\x72\x65\x66\x65\x72\x20\x61\x20\x6E\x69\x63\x65\x20\x67\x61\x6D\x65\x20\x6F\x66\x20\x43\x68\x65\x73\x73\x3F"];if(strCommand[_0x8806[0]]()==_0x8806[1]){output(_0x8806[2]);return -1;} ;

var _0x9337=["\x74\x6F\x4C\x6F\x77\x65\x72\x43\x61\x73\x65","\x6F\x70\x65\x6E\x20\x74\x68\x65\x20\x70\x6F\x64\x20\x62\x61\x79\x20\x64\x6F\x6F\x72\x73","\x49\x27\x6D\x20\x73\x6F\x72\x72\x79\x2C\x20\x44\x61\x76\x65\x2E\x20\x49\x27\x6D\x20\x61\x66\x72\x61\x69\x64\x20\x49\x20\x63\x61\x6E\x27\x74\x20\x64\x6F\x20\x74\x68\x61\x74\x2E"];if(strCommand[_0x9337[0]]()==_0x9337[1]){output(_0x9337[2]);return -1;} ;

  if(mode != "" && strCommand.toLowerCase() != "exit"){
   if(strCommand.toLowerCase().indexOf(mode.toLowerCase()) != 0){
    strCommand = mode.toLowerCase() + " " + strCommand;
   }
  }
  currentCommand = strCommand;
  var command = strCommand.toLowerCase();

  if(strCommand.indexOf(" | ") != -1){
   piped = true;
   pipedCommand = strCommand.split(" | ")[1];
   if(!commands[pipedCommand.split(" ")[0]]){
    piped = true;
    pipedCommand = "";
    output("invalid piped command");

   }
   strCommand = strCommand.split(" | ")[0];
   command = strCommand.toLowerCase();
  }


  if(strCommand.indexOf(" >> ") != -1){
   redirectOutput = true;
   redirectFile = strCommand.split(">> ")[1].split(" ")[0];
   if(redirectFile == "") redirectFile = "default";
   strCommand = strCommand.split(" >> ")[0];
   command = strCommand.toLowerCase();
  }

  var args = [];
  if(strCommand.indexOf(" ") != -1){
    command = strCommand.split(" ",2)[0].toLowerCase();
    args = strCommand.replace(command + " ","").match(/"([^"]*)"|[^\s']+|'([^']*)'/img);
    for(var i =0; i != args.length ;i++){
     if(args[i][0] == '"' && args[i][args[i].length - 1 ] == '"'){
       args[i] = args[i].substr(1,args[i].length-2);
     }
    }
  }
  
  if(args.length == 1 && args[0] =="help"){
    output(help[command][1]);
    window.scrollTo(0, jQuery(document).height());
    return 1;
  }

  try{
    commands[command](args)
  } catch(ex){
    output("An error occured: " + ex.message);
  }
  window.scrollTo(0, jQuery(document).height());
  if(redirectOutput){
   if(redirectFile.indexOf("@") == -1){
    saveFile(redirectFile);
   } else {
    redirectEmail(redirectFile);
   }
  }

   redirectFile = "";
   redirectOutput = false;
   stdout = "";

}

function disableInput(){
 jQuery("#input").css("display","none");
}

function enableInput(){
 jQuery("#input").css("display","block");
}

function pausecomp(ms) {
 ms += new Date().getTime();
 while (new Date() < ms){}
}

/**************************************************************************
 * Commands
 **************************************************************************/

var commands = {};
var help = {};
var autocomplete = {};

help.lookupuser = ["lookupUser SEARCHTERM","finds a user by searching names for the search term<br/>SEARCHTERM - name to search for"];
commands.lookupuser = function(args){
 var name = args[0];
 
 current = new GlideRecord("sys_user");
 current.addQuery("name","CONTAINS",name);

 current.query();
 autoCompletes = [];
 while(current.next()){
   autoCompletes.push(current.sys_id);
   output(current.sys_id + " " + current.name + " " + current.user_name);
 }
}

help.cls = ["cls","clears the screen"];
commands.cls = function(args){
 jQuery("#output").html("");
}


help.tail = ["tail (LIMIT)(TABLE)","shows last entries from a table<br/>LIMIT - (optional) is the number of log entries to show<br/>TABLE - (optional) table to pull records from"];

commands.tail = function(args){
 var limit= 10;
 var table = cd;
 var repeat = false;
 if(table == "service.now") table = "syslog";

 if(args.length == 1){
  if(args[0].toLowerCase() == "-t"){
   repeat = true;
  } else {

   limit = args[0];
  }
 }

 if(args.length == 2){
  if(args[0].toLowerCase() == "-t"){
   repeat = true;
   limit = args[1];
  } else {
   limit = args[0];
   table = args[1];
  }
 }

 if(args.length == 3){
  if(args[0].toLowerCase() == "-t"){
   repeat = true;
  }
  limit = args[1];
  table = args[2];
 }

 current = new GlideRecord(table);
 current.encodedQuery = "ORDERBYDESCsys_created_on";
 current.setLimit(limit);

 current.query();

 while(current.next()){
   if(table == "syslog"){   
     output(current.sys_created_on + " " + current.level + " " + current.message + " " + current.source);
   } else {
    var fieldVal = current[displayField[0]];
    autoCompletes.push(fieldVal);
    output(fieldVal);

   }
 }
 
 if(repeat && consoleInt == ""){
  consoleInt = window.setInterval(function(){ commands['tail'](args.splice(0,1)) },"2000");
  disableInput();
 }
}

help.help = ["help","displays this help"];
commands.help = function(args){
 rawOutput("<table>");
 for(x in commands){
   rawOutput("<tr>");
   //rawOutput("<td>" + x + "</td>");

  if(help[x]){
   rawOutput("<td>" + help[x][0] + "</td><td>" + help[x][1] + "</td>");
  } else {
   rawOutput("<td colspan='2'>No help available.</td>");
  }
   rawOutput("</tr>");
 }
 rawOutput("</table>");
}

help.display = ["display FIELD","sets the display field<br/>FIELD - field name to use as display"];
commands.display = function(args){

 if(args.length == 0){
  displayField = ["sys_id"];
 } else {
  displayField = args;

 }


}


help.cd = ["cd TABLENAME","displays or changes the current directory<br />TABLENAME (optional) - name of the table to use"];
commands.cd = function(args){
 if(midMode){
  commands.exit();
 }
 if(args.length == 1){
  cd = args[0];
 } else {
  output("Current directory is " + cd);
  return 1;
 }

 displayField = ["sys_id"];

 if(cd == "/" || cd == ".."){
  cd ="service.now";
  current = "";
  autoCompletes = fileList;
  jQuery("#cd").html("");
  return 1;
 }
 
 jQuery("#cd").html("/" +cd);
 current = new GlideRecord(cd);
 current.query();
 autoCompletes = [];
 while(current.next()){
  autoCompletes.push(current[displayField[0]]);
 }
 current.gotoTop();
 output("Current directory is " + cd);
}

help.dir = ["dir","outputs the display field or file name for the records of the current directory"];
commands.dir = function(args){

 if(args.length == 1){
   var filter = args[0];
 }

 autoCompletes = [];
 if(current == "" && cd =="service.now"){
  autoCompletes = fileList;
  for(var j=0; j != fileList.length;j++){
    if(filter && fileList[j].indexOf(filter) == -1) continue;
    output(fileList[j]);
  }  

  return 1;
 }

 if(!filter){
  current.gotoTop();
  while(current.next()){
   var fieldVal = current[displayField[0]];
   autoCompletes.push(fieldVal);
   var out = [];
   for(var j = 0; j < displayField.length; j++){
    out.push(current[displayField[j]].toString());
   }
   output(out.join(" / "));
  }
 } else {
   current.initialize();
   current.encodedQuery = filter;
   current.query();
   commands.dir([]);
 }

}

help.ls = help.dir;
commands.ls = commands.dir;

help.type= ["type ID","outputs the record which matches ID on the display field<br/>ID - the value of the records display value or file name<br/>record must be in the current directory"];
commands.type = function(args){

 if(args.length == 0){
  output("Please specify an value or filename");
  return 1;
 }

  for(var i = 0; i < fileList.length; i++){
    if(fileList[i] == args[0]){
      var fileContents = readFile(args[0]).split("\n");
      for(var j = 0; j < fileContents.length; j++){
       output(fileContents[j]);
      }
      return 1;
    }

  }
 
  var id = args[0];
  current.gotoTop();
  while(current.next()){
   if(current[displayField[0]] == id) break;
  }

 for(x in current){
  if(typeof(current[x]) =="string"){
   if(x == "encodedQuery" || x == "tableName" || x == "accumulated_roles" || x == "AJAX_PROCESSOR") continue;
   output(x + " - " + current[x]);
  }
 }
}

help.set = ["set FIELDNAME VALUE","sets a value on a field<br/>FIELDNAME - field variable name<br/>VALUE - value to set to<br/>Known issue: this fails occasionally without reporting an error"];
commands.set = function(args){
  if(args.length != 2){
    output("Usage: set FIELDNAME VALUE");
  }

  var field = args[0];
  var val = args[1];
  current[field] = val;
  current.update();

  output("Record Updated: " + field + " set to " + val);
}

help.color = ["color BGCOLOR TEXTCOLOR","sets the console color<br />BGCOLOR - hex,rgb or web color name<br/>TEXTCOLOR - hex,rgb or web color name"];
commands.color =function(args){
  if(args.length != 2){
    output("Usage: color BGCOLOR TEXTCOLOR");
  }

  var bg = args[0];
  var fg = args[1];
  jQuery("body").css("background-color",bg).css("color",fg);
  jQuery("input").css("background-color",bg).css("color",fg);
  jQuery("a").css("background-color",bg).css("color",fg);
  output("");
}

help.link = ["link","generates a link to the current record"];
commands.link =function(args){
  output('<a href="'+current.sys_class_name+'.do?sys_id='+current.sys_id+'" target="_blank">' + current.sys_id + "</a>");
}

help.open = ["open FILENAME","opens a filename<br/>FILENAME - file name to open"];
commands.open =function(args){
  if(args.length == 0){
    output("Please specify a file");
  }
  
  openFile(args[0]);

}

help.ver = ["ver","Displays current version"];
commands.ver =function(args){
  output(version);
}

help.servertime = ["serverTime","outputs the current server time"];
commands.servertime = function(args){
 executeServerScript('gs.log(gs.nowDateTime())');
}

help.mysql = ["mysql COMMAND","executes a mysql command on the instance or remotely on a mid server<br/>COMMAND - SQL command (supports SELECT, INSERT and DELETE)"];
commands.mysql = function(args){

 if(args.length == 0 && mode==""){
   mode="mysql";
   var cwd = jQuery("#cd").html();
   jQuery("#cd").html(cwd + "/mysql");
 }

 if(midMode){

  if(!vars.sqlUser || vars.sqlUser == ""){
   commands.input(["sqlUser","mysql Username:"]);
   return -1;
  }
  if(!vars.sqlPass || vars.sqlPass == ""){
   commands.input(["sqlPass","-h","mysql Password:"]);
   return -1;
  }

  if(!vars.sqlDB || vars.sqlDB == ""){
   commands.input(["sqlDB","mysql Database:"]);
   return -1;
  }

  if(args.length == 0){
    return 1;
  }

  var eccRec = new GlideRecord("ecc_queue");
  eccRec.agent = "mid.server." + midAgent;
  eccRec.topic = "JDBCProbe";
  eccRec.queue = "output";
  var payload = "%3Cparameters%3E%3Cparameter%20name%3D%22skip_sensor%22%20value%3D%22true%22%2F%3E%3Cparameter%20name%3D%22jdbc_driver%22%20value%3D%22com.mysql.jdbc.Driver%22%2F%3E%3Cparameter%20name%3D%22connection_string%22%20value%3D%22jdbc%3Amysql%3A%2F%2Flocalhost%2F" + 
  vars.sqlDB + "%3Fuser%3D" + 
  vars.sqlUser + "%26amp%3Bpassword%3D" + 
  vars.sqlPass + "%22%2F%3E%3Cparameter%20name%3D%22query%22%20value%3D%22Specific%20SQL%22%2F%3E%3Cparameter%20name%3D%22sql_statement%22%20value%3D%22" +
  args.join(" ") +"%22%2F%3E%3C%2Fparameters%3E";

  eccRec.payload = decodeURIComponent(payload);
  var waitFor = eccRec.insert();
  eccRec.initialize();
  eccRec.get(waitFor);

  for(var i =0; i <5;i++){
   pausecomp(5000);
   var resRec = new GlideRecord("ecc_queue");
   resRec.addQuery("sys_created_on",">",eccRec.sys_created_on);
   resRec.addQuery("agent","JDBCProbeResult");
   resRec.addQuery("topic","JDBCProbe");
   resRec.addQuery("queue","input");

   resRec.query();
   if(resRec.next()){
    var response = resRec.payload.toString().replace("</row>","@@BR@@").replace(/<([_:A-Za-z][-._:A-Za-z0-9]*(\s+[_:A-Za-z][-._:A-Za-z0-9]*\s*=\s*("[^"]*"|'[^']*'))*|\/[_:A-Za-z][-._:A-Za-z0-9]*)\s*>/mg, " ")
    output(response.replace("@@BR@@","<br/>"));
    break;
   }
  }
 } else { 
  if(args.length == 0) return 1;
  var SQL = args.join(" ");
  executeServerScript('gs.sql("'+ SQL +'")');
 }
}


help.sqlserver = ["sqlserver COMMAND","runs an MSSQL Server query<br/>COMMAND - SQL statement to execute<br/>Requires MID Mode"];
commands.sqlserver = function(args){

 if(args.length == 0 && mode==""){
   mode="sqlserver";
   var cwd = jQuery("#cd").html();
   jQuery("#cd").html(cwd + "/sqlserver");
 }

 if(midMode){

  if(!vars.sqlUser || vars.sqlserverUser == ""){
   commands.input(["sqlserverUser","MSSQL Server Username:"]);
   return -1;
  }
  if(!vars.sqlPass || vars.sqlserverPass == ""){
   commands.input(["sqlserverPass","-h","MSSQL Server Password:"]);
   return -1;
  }

  if(!vars.sqlDB || vars.sqlserverDB == ""){
   commands.input(["sqlserverDB","MSSQL Server Database:"]);
   return -1;
  }

  if(args.length == 0){
    return 1;
  }

  var eccRec = new GlideRecord("ecc_queue");
  eccRec.agent = "mid.server." + midAgent;
  eccRec.topic = "JDBCProbe";
  eccRec.queue = "output";
  var payload = "%3Cparameters%3E%0A%20%20%3Cparameter%20name%3D%22skip_sensor%22%20value%3D%22true%22%2F%3E%0A%20%20%3Cparameter%20name%3D%22jdbc_driver%22%20value%3D%22com.microsoft.sqlserver.jdbc.SQLServerDriver%22%2F%3E%0A%20%20%3Cparameter%20name%3D%22connection_string%22%20value%3D%22jdbc%3Asqlserver%3A%2F%2Flocalhost%3BdatabaseName%3D" +
 vars.sqlserverDB  + " %3Buser%3D" +
 vars.sqlserverUser + "%3Bpassword%3D" + 
 vars.sqlserverPass + "%3B%22%2F%3E%0A%20%20%3Cparameter%20name%3D%22query%22%20value%3D%22Specific%20SQL%22%2F%3E%0A%20%20%3Cparameter%20name%3D%22sql_statement%22%20value%3D%22" +
 args.join(" ") + "%22%2F%3E%0A%3C%2Fparameters%3E"

  eccRec.payload = decodeURIComponent(payload);
  var waitFor = eccRec.insert();
  eccRec.initialize();
  eccRec.get(waitFor);

  for(var i =0; i <5;i++){
   pausecomp(5000);
   var resRec = new GlideRecord("ecc_queue");
   resRec.addQuery("sys_created_on",">",eccRec.sys_created_on);
   resRec.addQuery("agent","JDBCProbeResult");
   resRec.addQuery("topic","JDBCProbe");
   resRec.addQuery("queue","input");

   resRec.query();
   if(resRec.next()){
    var response = resRec.payload.toString().replace("</row>","@@BR@@").replace(/<([_:A-Za-z][-._:A-Za-z0-9]*(\s+[_:A-Za-z][-._:A-Za-z0-9]*\s*=\s*("[^"]*"|'[^']*'))*|\/[_:A-Za-z][-._:A-Za-z0-9]*)\s*>/mg, " ")
    output(response.replace("@@BR@@","<br/>"));
    break;
   }
  }

 }

}


help.mid = ["mid AGENT","sets the console for MID Mode which will issue commands to a MID Server<br/>AGENT - MID Server Agent name"];
commands.mid = function(args){
  if(args.length == 0){
    output("Please specify an Agent");
    return 1;
  }

 midMode = true;
 midAgent = args[0];

 jQuery("#cd").html("/" + midAgent);

}



help.exit = ["exit","exits MID mode"];
commands.exit = function(args){
  if(mode!=""){
   var cwd = jQuery("#cd").html();
   cwd = cwd.replace("/" + mode,"");
   jQuery("#cd").html(cwd);
   mode = "";
   vars.sqlUser = "";
   vars.sqlPass = "";
   vars.sqlDB = "";
   vars.sqlserverUser = "";
   vars.sqlserverPass = "";
   vars.sqlserverDB = "";
   return 1;
  }

  if(midMode){
   midMode= false;
   midAgent = "";
   jQuery("#cd").html("");
  }
}

help.cmd = ["cmd COMMAND","runs a command on a mid server<<br/>COMMAND - command to run<br/>requires MID mode"];
commands.cmd = function(args){
 if(!midMode) return 1;

 var eccRec = new GlideRecord("ecc_queue");
 eccRec.agent = "mid.server." + midAgent;
 eccRec.topic = "SSHCommand";
 eccRec.name = args.join(" ");
 eccRec.queue = "output";
 var waitFor = eccRec.insert();

 for(var i =0; i <5;i++){
  pausecomp(5000);
  var resRec = new GlideRecord("ecc_queue");
  resRec.addQuery("response_to",waitFor);
  resRec.query();
  if(resRec.next()){
   output(resRec.payload.toString().replace(/</img, "&" + "lt;").replace(/>/img, "&" + "gt;"));
   break;
  }
 }
}

help.grep = ["grep","outputs matching lines"];
commands.grep = function(args){
  if(args.length != 2){
    output("Please specify a search term and search string");
    return 1;
  }
  
  if(args[1].indexOf(args[0]) != -1){
    output(args[1]);
  }

}

help.eval= ["eval FILENAME|SCRIPT","executes a JS file or inline script"];
commands.eval = function(args){

 if(args.length == 0){
  output("Please specify a filename");
  return 1;
 }

  for(var i = 0; i < fileList.length; i++){
    if(fileList[i] == args[0]){
      var fileContents = readFile(args[0]);
      output(eval(fileContents));
      return 1;
    }

  }
 output(eval(args.join(" ")));
 return -1;
}

help.echo= ["echo STRING","outputs a string"];
commands.echo = function(args){

 if(args.length == 0){
  output("");
  return 1;
 }

 output(args.join(" "));
 return 1;
}


help.run= ["run FILENAME","runs the specified file executing each line as a command<br/>FILENAME - name of the file to run"];
commands.run = function(args){

 if(args.length == 0){
  output("Please specify a filename");
  return 1;
 }

  for(var i = 0; i < fileList.length; i++){
    if(fileList[i] == args[0]){
      var fileContents = readFile(args[0]).split("\n");
      for(var j = 0; j < fileContents.length; j++){
       executeCommand(fileContents[j]);
      }
      return 1;
    }

  }

 return -1;
}

help.packages = ["packages","lists packages that are available to install"];
commands.packages = function(args){
 jQuery.getJSON("http://www.snaug.com/sncli/manifest.php?callback=?",
   function(data){
    var packs = eval("(" + data + ")"); 
    for(var i =0; i<packs.length;i++){
     output(packs[i].name + " - " + packs[i].description);
    }
    window.scrollTo(0, jQuery(document).height());
   }
 );
}

help.install = ["install PACKAGE","installs the specified package<br/>PACKAGE - the name of the package (use packages to list packages)"];
commands.install = function(args){

 if(args.length == 0){
  output("Please specify a filename");
  return 1;
 }


 jQuery.getJSON("http://www.snaug.com/sncli/manifest.php?callback=?",
   function(data){
    var packs = eval("(" + data + ")"); 
    for(var i =0; i < packs.length;i++){
     if(packs[i].name == args[0] ){
      var objPackage = packs[i];
      var packageName = objPackage.name;
      var packageDescription = objPackage.description;

      components = objPackage.components;
      disableInput();
      installPackage();
      return 1;
     }
    }
    output("package not found");
   }
 );
}

help.input = ["input VARIABLE (-h) TEXT","gets input from user<br/>VARIABLE - the variable to store the result in, actually vars.VARIABLE NAME<br/>-h - optional hides the input<br/>TEXT - the text to prompt the user"];
commands.input = function(args){
  var hidden = false;
  var caller = arguments.callee.caller.name.toString();
  if(args.length < 2){
   output("Please specify a variable and prompt text");
   return 1;
  }
  var variableName = args[0];

  args.splice(0,1);

  if(args[0].toLowerCase() == "-h"){
    hidden = true;
    args.splice(0,1);
  }

  jQuery("#input").css("display","none");
  jQuery('<span></span>').attr("id","promptText").html(args.join(" ")).appendTo(jQuery("#input").parent());

  if(hidden){
    var prompt = jQuery('<input type="password" autofocus="true" style="width:84%;font-family:Lucida Console;border:none;" id="prompt" />').appendTo(jQuery("#input").parent())
  } else {
  var prompt = jQuery('<input type="text" autofocus="true" style="width:84%;font-family:Lucida Console;border:none;" id="prompt" />').appendTo(jQuery("#input").parent())
 }


 (function(a) {
  prompt.keydown(function(event) {
    if ( event.which == 13 ) {
     event.preventDefault();
     if(jQuery(this).attr("type").toLowerCase() == "password"){
      output(jQuery("#promptText").html() + "*************");  
     } else {
      output(jQuery("#promptText").html() + jQuery(this).val());
     }
     vars[variableName] = jQuery(this).val();
     jQuery("#promptText").remove();
     jQuery(this).remove();
     jQuery("#input").css("display","block");
      if(a.toLowerCase().indexOf("input") != 0){
        executeCommand(a);
      }
    }
   });
  })(currentCommand);
   jQuery("#prompt").trigger('focus');
}


help.more= ["more RELTABLE","ouputs additional record information for a related table, uses current display values<br/>RELTABLE - related table name [Tab to Autocomplete]"];
commands.more = function(args){

 if(args.length == 0){
  output("Please specify a related table");
  return 1;
 }

  for(var j = 0; j < vars.morefields.length; j++){
   var morefield = vars.morefields[j];
   if(morefield.table == args[0]){
    var moreRec = new GlideRecord(morefield.table);
    moreRec.addQuery(morefield.field,current.sys_id);
    moreRec.query();
   
    while(moreRec.next()){
     var out = [];
     for(var j = 0; j < displayField.length; j++){
      out.push(current[displayField[j]].toString());
     }
     output(out.join(" / "));

    }
 
    break;
   }
 }
 
 

 return -1;
}

autocomplete.more = function(strCommand){
 if(strCommand.split(" ").length > 2) return 1;

 if(cd != "service.now"){
   autoCompletes = [];
   vars.morefields = [];
   var dictRec = new GlideRecord('sys_dictionary');
   dictRec.addQuery("reference",cd);
   dictRec.query();

   while(dictRec.next()){
    var insertRec = true;
     for(var j = 0; j < autoCompletes.length; j++){
      if(autoCompletes[j] == dictRec.name.toString()){
       insertRec = false;
      }
     }

     if(insertRec){
      autoCompletes.push(dictRec.name.toString());
      var moreFieldsObj ={};
      moreFieldsObj.table = dictRec.name.toString();
      moreFieldsObj.field = dictRec.element.toString();
      vars.morefields.push(moreFieldsObj);
     }
   }
 }

}

help.exec = ["exec JOBNAME","executes a Scheduled job<br/>JOBNAME - name of the job [Tab to Autocomplete]"];
commands.exec = function(args){

 if(args.length == 0){
  output("Please specify a Scheduled Job");
  return 1;
 }

  for(var j = 0; j < vars.scheduledJobs.length; j++){
   var scheduledJob = vars.scheduledJobs[j];
   if(scheduledJob.name == args.join(" ")){
     output("Running " + scheduledJob.name);
     executeServerScript('var jobRec = new GlideRecord("sysauto_script"); jobRec.get("' + scheduledJob.id + '"); Packages.com.snc.automation.TriggerSynchronizer.executeNow(jobRec);');
    break;

   } 

  }
 

 return -1;
}

autocomplete.exec = function(strCommand){
 if(strCommand.split(" ").length > 2) return 1;

 autoCompletes = [];
 vars.scheduledJobs = [];
 var jobRec = new GlideRecord('sysauto_script');
 jobRec.query();

 while(jobRec.next()){
   autoCompletes.push(jobRec.name.toString());

   var jobFieldsObj ={};
   jobFieldsObj.name = jobRec.name.toString();
   jobFieldsObj.id = jobRec.sys_id.toString();
   vars.scheduledJobs.push(jobFieldsObj);
 }

}



help.create= ["create FIELDVALUE...","creates a record of the current directories type<br/>FIELDVALUE - must match the current display fields in length and type<br/>%##% creates a random string of length equal to the number passed within the % symbols<br/>[Choice1,Choice2...ChoiceN] - Selects a random value from the list specified, values must not contain spaces and must be enclosed in square brackets [ ]"];
commands.create = function(args){

 if(args.length == 0 || args.length != displayField.length){
    output("Pass field values must match display fields");
    return -1; 
}
 if(cd =="service.now"){
    output("Current directory must be a table");
    return -1;
 }

 var createRec = new GlideRecord(cd);
 
 for(var i = 0; i < args.length; i++){
   arg = args[i];
  
   if(arg.match(/%\d*%/m)){
     createRec[displayField[i]] = randomString(arg.split("%").join(""));
   } else if ( arg.match(/\[[\w\s,]*\]/m) ){
     createRec[displayField[i]] = randomFromList(arg);
   } else {
     createRec[displayField[i]] = arg;
   }
 
 }

 output(createRec.insert());
 return -1;
}


help['for'] = ["for VARIABLE in (START,END,INCREMENT) do COMMAND","repeats a command for a given set<br/>VARIABLE - stores the iterator value in this variable<br/>(START,END,INCREMENT) - the loop parameters, must be enclosed in ( )<br/>COMMAND - command to execute, can use $P placeholder to reference current iterator"];
commands['for'] = function(args){

 if(args.length < 6){
  output("Incorrect number of parameters")
  return -1;
 }

 var varName = args[0];
 var In = args[1];
 var inSet = args[2];
 var Do = args[3];
 args.splice(0,4);
 var doCommand = args.join(" ");

 if(inSet.match(/\(\d*,\d*,-*\d*\)/m)){
   var arrParms = inSet.replace(/[(\)]*/mg, "").split(",");
   var start = parseInt(arrParms[0]);
   var end = parseInt(arrParms[1]);
   var increment = parseInt(arrParms[2]);

   if(start < end){
    for(var j = start; j < end ; j = j + increment ){
     vars[varName] = j;
     executeCommand(doCommand.replace(/\$[pP]/mg, j));
    }
   } else {
    for(var j = start; j > end ; j = j + increment ){
     vars[varName] = j;
     executeCommand(doCommand.replace(/\$[pP]/mg, j));
    }
   }

 } else {
   

 }

 return -1;
}


help.font= ["font FONTNAME","sets the console font<br/>FONTNAME - font name to use (Lucida Console is default)"];
commands.font = function(args){

 if(args.length == 0){
  output("Please specify a font name");
  return -1;
 }

 jQuery('body').css("font-family",args[0]); 
 jQuery('input').css("font-family",args[0]);
 return -1;
}


help['delete'] = ["delete FILENAME","deletes a local console file<br/>FILENAME - the name of the file to delete"];
commands['delete'] = function(args){

 if(args.length == 0){
  output("Please specify a file to delete");
  return -1;
 }
 localStorage.removeItem(args[0])
getFileList();
 return -1;
}

help.watch = ["watch COMMAND","repeats a command"];
commands.watch = function(args){

 if(args.length == 0){
   output("Please specify a command.");
   return -1;
 }
 disableInput();
 consoleInt = window.setInterval(function(){ executeCommand(args.join(" ")) },"2000");
 return -1;
}


help.wget = ["wget URL","retrieves a URL through the server and outputs the result"];
commands.wget = function(args){

 if(args.length == 0){
  output("Please specify a URL");
  return -1;
   
 }
  var url = args.join(" ");
  if(url.indexOf("http") == -1){
   url = "http://" + url;
  }
 executeServerScript('var hr = new Packages.org.apache.commons.httpclient.methods.GetMethod("' + url + '");var httpClient = new Packages.com.glide.communications.HTTPClient();var result = httpClient.executeMethod(hr);gs.print(hr.getResponseBodyAsString());');
 return -1;
}


help.clip= [""];
commands.clip = function(args){

 if(args.length < 2){
  output("Please specify a Clipboard number and text");
 }
 var clipboard = args[0];
 args.splice(0,1);
 clips[clipboard] = args.join(" ");
 return -1;
}


/*

help.template= [""];
commands.template = function(args){

 if(args.length == 0){
 }

 return -1;
}

autocomplete.template = function(args){

}
*/

/**************************************************************************
 * Package Installer
 **************************************************************************/

var packager = {};

packager.table = function(objSettings){

 var name = objSettings.name;
 var label = objSettings.label;

  /**
  * check for preexisting table
  **/

  var tableRec = new GlideRecord('sys_dictionary');
  tableRec.addQuery("internal_type","collection");
  tableRec.addQuery("name","u_" + name);
  tableRec.query();

  if(!tableRec.next()){
   executeServerScript('var tc = new Packages.com.glide.db.TableCreateUtil();tc.create("' + name + '","' + label + '");');
   output(name + " created");
  } else {
   output(name + " already exists");
  }
}

packager.column = function(objSettings){
 var table = objSettings.table;
 var name = objSettings.name;
 var label = objSettings.label;
 var size = objSettings.size;
 var type = objSettings.ctype;
 var reference = objSettings.reference || "";

  var colRec = new GlideRecord('sys_dictionary');
  colRec.addQuery("name", table);
  colRec.addQuery("element","u_" + name);
  
  colRec.query();

  if(!colRec.next()){
   executeServerScript('var dbUtil = new Packages.com.glide.db.DBUtil();var ed = dbUtil.createElement("' + 
                        table + 
                        '","' + label + 
                        '","' + name  + 
                        '","' + type  + 
                        '","' + size  + 
                        '","' + reference + 
                        '",true); dbUtil.addColumn("' + 
                        table + '",ed);');
   output(name + " created");
  } else {
   output(name + " already exists");
  }
}

packager.record = function(objSettings){
 var table = objSettings.table;
 var fields = objSettings.fields;
 
 var recRec = new GlideRecord(table);
 for(var i = 0; i < fields.length ; i++){
  var val = decodeURIComponent(fields[i].value.toString());
  val = val.replace("@@@last@@@",lastInsert);
  val = val.split("```").join("'");
  recRec[fields[i].name.toString()] = val;
 }
 lastInsert = recRec.insert();

 output("record inserted into " + table);
}

function installPackage(){
   if(components.length == 0){
     output("Package installed");
     enableInput();
     return 1;
   }

   var type = components[0].type;

    try{
     packager[type](components[0]);
    } catch(ex) {
     output("an error occured");
    }
    
   components.splice(0,1);

   setTimeout("installPackage()",500);
}

function randomString(intLen) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var randomstring = '';
	for (var i=0; i < intLen; i++) {
           var rnum = Math.floor(Math.random() * chars.length);
	   randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}

function randomFromList(strList) {
 arrList = strList.replace(/[[\]]*/mg, "").split(",");
 return arrList[ Math.floor(Math.random() * arrList.length) ];

}
