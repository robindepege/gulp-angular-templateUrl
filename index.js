var _fs = require('fs'),
    _es = require('event-stream'),
    _regexTemplateurl = /(templateUrl)[:](.*?)[(,)|(\r\n)]/g,
    _opt;

String.prototype.endWith = function(suffix){
    return (this.indexOf(suffix, this.length - suffix.length) !== -1)
}

String.prototype.startWith = function(preffix){
    return (this.indexOf(preffix, 0) !== -1)
}

String.prototype.trim = function(){
    return this.replace(/^\s+|\s+$/gm,'');
}
    
module.exports = function(options){
    _opt = options;
    
    //---
    var cb = function(file, callback){
        var body = file.contents.toString();
        
        body = replace(body);
        
        file.contents = new Buffer(body);
        
        //---
        return callback(null, file);
    }
    
    //---
    return _es.map(cb);
}

function replace(body){
    var a = body.replace(_regexTemplateurl, function(s){
        return "template:"+s.split(':')[1].trim();
    });

    //---
    a = getByExt(a);
    
    //---
    return a;
}

function loadTemplate(url) {
    var s = _fs.readFileSync(url, 'utf8')
        .replace(/[\\']/g, '\\$&').replace(/\u0000/g, '\\0')
        .replace(/<!--[\s\S]*?-->/g, '') 
        .replace(/\s{2,}/g, '')
        .replace(/\n/g, '');

    //---
    return s.substring(1, s.length);
}

function getByExt(body){
    var e = ""

    if(_opt.exts instanceof Array){
        e += "(";
        _opt.exts.forEach(function(l){
            e+= "(\\"+l+")|"
        });
        e = e.substring(0, e.length-1);
        e += ")";
    }
    else{
        e = "(\\"+_opt.exts+")";
    }
    
    var r = new RegExp("(\"|')((.*?)"+e+")(\"|')[(,)|(\r\n)]", "g");
    
    return body.replace(r, function(s){
        var url = s.trim(),
            suff = url.endWith(',') ? 2 : 1;

        url = url.substring(1, url.length-suff);
        
        if(_opt.from){
            var from = _opt.from.endWith('/') ? _opt.from : _opt.from + '/'; 

            url = from+url;
        }
        
        //---
        var res = "'"+loadTemplate(url)+"'";
        if(suff > 1)
            res +=",";
        else
            res +="\r";

        //---
        return res;
    });
}