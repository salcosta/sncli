var scr="%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%20%3F%3E%0A%3Cj%3Ajelly%20trim%3D%22false%22%20xmlns%3Aj%3D%22jelly%3Acore%22%20xmlns%3Ag%3D%22glide%22%20xmlns%3Aj2%3D%22null%22%20xmlns%3Ag2%3D%22null%22%3E%0A%0A%20%3Cscript%20src%3D%22https%3A%2F%2Fajax.googleapis.com%2Fajax%2Flibs%2Fjquery%2F1.7.0%2Fjquery.min.js%22%20%3E%3C%2Fscript%3E%0A%20%3Cscript%20src%3D%22http%3A%2F%2Fsnaug.com%2Fscripts%2Fservicedotnow-min.js%22%20%3E%3C%2Fscript%3E%0A%20%3Clink%20rel%3D%22stylesheet%22%20type%3D%22text%2Fcss%22%20href%3D%22http%3A%2F%2Fsnaug.com%2Fscripts%2Fservicedotnow.css%22%20%2F%3E%0A%0A%20%3Cdiv%20style%3D%22%3Bheight%3A100%25%3Bwidth%3A100%25%22%3E%0A%20%20%3Cdiv%20id%3D%22output%22%20%2F%3E%0A%20%20%3Cdiv%20id%3D%22input%22%3E%3Cspan%3Eservice.now%3Cspan%20id%3D%22cd%22%3E%3C%2Fspan%3E%3E%3C%2Fspan%3E%3Cinput%20autofocus%3D%22true%22%20style%3D%22width%3A84%25%3Bfont-family%3Acourier%3Bborder%3Anone%3B%22%20id%3D%22command%22%20%2F%3E%3C%2Fdiv%3E%0A%20%3C%2Fdiv%3E%0A%0A%3C%2Fj%3Ajelly%3E";
var gRec = new GlideRecord("sys_ui_page");  
gRec.addQuery("name","service.now");  
gRec.query(); 
if(!gRec.next()){  
 gRec.initialize();
 gRec.name ="service.now"; 
 gRec.html = decodeURIComponent(scr); 
 gRec.description = "service.now Command Line Interface by Sal Costa www.snaug.com"; 
 gRec.insert(); 
} 
window.location = "service.now.do";