var express = require('express');
var app = express();
var config = require('./config/config');
var https = require('https');
var Nexmo = require('nexmo');
var fs = require('fs');
var path = require('path');
var jsonfile = require('jsonfile');
var bodyParser = require('body-parser');

app.use(bodyParser());
app.use('/static', express.static(__dirname + '/static'));

var privateKey = fs.readFileSync(__dirname + '/config/privateKey');
var appId = config.NEXMO_VOICE_ID;

var opts = {debug: true};

var nexmo = new Nexmo({
apiKey: config.NEXMO_API_KEY,
apiSecret: config.NEXMO_API_SECRET,
applicationId: appId,
privateKey: privateKey
},opts);


app.get('/', function (req, res) {
  res.sendFile(__dirname+'/index.html');
});


app.post('/sms', function (req, res){

    var post_data = req.body;
    var sender = 'NEXMO';
    var recipient = post_data.to_phone_number;
    var message = post_data.message_body;
    if(!(recipient in config.PRE_CONFIGURED_NUMBERS)){
        res.json({"msg":"Thank you for trying our Services! We are in Privte Beta Currently, pls contact@ jain.rohit.2929@gmi.com for access"})
    }

    nexmo.message.sendSms(sender, recipient, message, function (res_sms, err_sms){
        if(err_sms){
            res.json({"msg":"Could not send message, try Again!", 'error':err_sms})
        }
        console.log(res_sms);
        res.json({"msg":"message Sent succesfully!"});
    });

});


app.get('/send_answer_script/:file_name', function (req, res){
        file_name = req.params.file_name;
        console.log('/static/answer_scripts/'+file_name);
        try{
             var file_path = __dirname+'/static/answer_scripts/'+file_name;
             stats = fs.lstatSync(file_path);
             res.sendFile(file_path);
         }
        catch(err){
            console.log(err);
            res.sendFile(__dirname+'/static/answer_scripts/pre_load_voice.json');
        }
});

app.post('/call',function(req, res){
    
    var post_data = req.body;
    var answer_text = post_data.answer;
    var answer_file = 'pre_load_voice.json';
    var to_phone_number = post_data.to_phone_number
    if(to_phone_number==null)
        to_phone_number = '919717985630'

    if(answer_text){
        var answer_json = [{'action':'talk','voice_name':'Russell','text':answer_text}];        
        var req_id = (new Date).getTime();
        answer_file = req_id +'.json';

        var file_path = __dirname+'/static/answer_scripts/'+answer_file;
        
        //Write the Inoming answer to json file and make call using this text, not pre_loaded answer
        jsonfile.writeFile(file_path, answer_json, function (err) {
            if (err){
                console.error(err);
                answer_file = 'pre_load_voice.json';
            }

    });}
    console.log(config.SERVER_IP + ":" + config.SERVER_PORT + '/send_answer_script/'+answer_file);
    nexmo.calls.create({
     to: [{
             type: 'phone',
             number: to_phone_number
         }],
     from: {
             type: 'phone',
             number: '919717985630'
         },
     answer_url: [config.SERVER_IP + ":" + config.SERVER_PORT + '/send_answer_script/'+answer_file]
     }, function(err_call, res_call) {
         if(err_call) { res.json({"error":err_call,'msg':'Some Error occurred!'}); }
         else { res.json({'msg':'Call Connected', 'Info':res_call}); }
     });

    
});


app.listen(config.SERVER_PORT, function () {
  console.log('listening on *:'+config.SERVER_PORT);
});

