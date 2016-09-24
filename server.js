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


var nexmo = new Nexmo({
apiKey: config.NEXMO_API_KEY,
apiSecret: config.NEXMO_API_SECRET,
applicationId: appId,
privateKey: privateKey
});


app.get('/', function (req, res) {
  res.sendFile(__dirname+'/index.html');
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

    if(answer_text){
        var answer_json = [{'action':'talk','voice_name':'Rohit','text':answer_text}];        
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
             number: '919717985630'
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

