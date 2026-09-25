/*
  Google Apps Script - أبو طارق
  1) اعمل Google Sheet جديد.
  2) أنشئ ورقة باسم Products.
  3) في الصف الأول ضع:
     id | name | category | image | description | active
  4) الصق هذا الكود في Extensions > Apps Script.
  5) غيّر ADMIN_KEY إلى كلمة سر من اختيارك.
  6) Deploy > New deployment > Web app
     Execute as: Me
     Who has access: Anyone
  7) انسخ رابط /exec وضعه في app.js وadmin.html.
*/

const ADMIN_KEY = "CHANGE_THIS_KEY";

function doGet() {
  const sh = SpreadsheetApp.getActive().getSheetByName("Products");
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);

  const headers = values.shift().map(String);
  const rows = values.map(r => Object.fromEntries(headers.map((h,i)=>[h,r[i]])))
    .filter(p => String(p.active).toLowerCase() !== "false");
  return ContentService.createTextOutput(JSON.stringify(rows)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    if (body.key !== ADMIN_KEY) return json({ok:false,error:"unauthorized"});
    const sh = SpreadsheetApp.getActive().getSheetByName("Products");
    if (body.action === "add") {
      const p = body.product || {};
      sh.appendRow([Utilities.getUuid(),p.name||"",p.category||"",p.image||"",p.description||"",true]);
      return json({ok:true});
    }
    if (body.action === "delete") {
      const id = String(body.id||"");
      const data = sh.getDataRange().getValues();
      for (let i=1;i<data.length;i++) {
        if (String(data[i][0])===id) {
          sh.deleteRow(i+1);
          return json({ok:true});
        }
      }
      return json({ok:false,error:"not_found"});
    }
    return json({ok:false,error:"unknown_action"});
  } catch(err) {
    return json({ok:false,error:String(err)});
  }
}

function json(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}