var myAirports;
var myRunways;
function setup()
{
  document.getElementById("status").value="form load complete.";
  var xhttp1 = new XMLHttpRequest();
    xhttp1.onreadystatechange = function() 
    {
      if (this.readyState == 4 && this.status == 200) 
      {
        let jsontext = this.responseText;
        myAirports=JSON.parse(jsontext);
        if (myAirports.length>0)
          document.getElementById("status").value += " Airport database loaded"
      }
    };
    try
    {
      xhttp1.open("GET", "MyAirports.json", true);
      xhttp1.send();
    }
    catch(err)
    {
      document.getElementById("txt").value=err.message;
    }
    
    var xhttp2 = new XMLHttpRequest();
    xhttp2.onreadystatechange = function() 
    {
      if (this.readyState == 4 && this.status == 200) 
      {
        document.getElementById("txt").value="in xhttp2 ";
        let jsontext = this.responseText;
        myRunways =JSON.parse(jsontext);
        document.getElementById("txt").value+= "myRunways.length="+myRunways.length;
      }
    };
    try
    {
      xhttp2.open("GET", "RunwayDB.json", true);
      xhttp2.send();
    }
    catch(err)
    {
      document.getElementById("txt").value=err.message;
    }
}

let icao="";
function LookupLatLon()
{
  document.getElementById("txt").innerHTML="";
  if (myAirports!=undefined)
  {
    icao = document.getElementById("icaolookup").value.toUpperCase();
    if (icao.length==4)
    {
      let ll = GetLatLong(icao);
      if (ll.length>0)
      {
        let llsplit = ll.split(",");
        if (verifyLatLon(llsplit[0],llsplit[1]))
        {
          document.getElementById("icaolookup").value=icao+" latlon="+ll;
          document.getElementById("lat").value=llsplit[0];
          document.getElementById("lon").value=llsplit[1];
        }
      }
      else
      {
        document.getElementById("icaolookup").value=icao+" is not in the database"
        icao="";
      }
    }
    else
    {
      document.getElementById("icaolookup").value="Invalid ICAO";
      icao="";
    }
  }
  else
  {
    document.getElementById("icaolookup").value="No database loaded"
  }
 
}

function SetupCircle()
{
  try{
  icao = document.getElementById("icao").value;
  let runway = document.getElementById("runway").value;
  let dist = document.getElementById("distance").value;
  let radius = document.getElementById("radius").value;
  let ap = myRunways.filter(x=>x.icao==icao);
  if (ap.length==1)
  {
    let rwy1=ap[0].rwys.filter(x=>x.rwy==runway);
    let otherend = runway-18;
    if (otherend<=0)
      otherend+=36;
    let rwy2=ap[0].rwys.filter(x=>x.rwy==otherend);
    // setup runway threshold lat/lon
    let lat1=Number(rwy1[0].lat);
    let lon1=Number(rwy1[0].lon);
    let lat2=Number(rwy2[0].lat);
    let lon2=Number(rwy2[0].lon);
    let disthead=DistHeading(lat1,lon1,lat2,lon2);
    let headingtoend= Number(FixHeading(disthead[1]-180)).toFixed(1);
    let circlEnd = NewPoint(lat1,lon1,headingtoend,dist);
    let headingtobegin=Number(FixHeading(headingtoend+90)).toFixed(1)
    let circleBegin = NewPoint(Number(circlEnd[0]),Number(circlEnd[1]),Number(headingtobegin) ,radius*2)
     
    document.getElementById("inlat").value=circleBegin[0];
    document.getElementById("inlon").value=circleBegin[1];
    document.getElementById("outlat").value=circlEnd[0];
    document.getElementById("outlon").value=circlEnd[1];
    document.getElementById("heading").value=Math.round(headingtoend);
  }
  }
  catch(err)
  {
    txt.value+=err.message+"\n";
    txt.value+=err+"\n";
  }
}

function MakeCircle()
{
  let inlat = document.getElementById("inlat").value;
  let inlon = document.getElementById("inlon").value;
  let outlat = document.getElementById("outlat").value;
  let outlon = document.getElementById("outlon").value;
  let heading = document.getElementById("heading").value;
  let points = document.getElementById("points").value;
  try
  {
    let txt= document.getElementById("txt");
    txt.value=inlat+" "+inlon+" "+outlat+" "+outlon+" "+heading+" "+points;
    xmlData = Circling([inlat, inlon],[outlat, outlon],heading,points);
   
    txt.value+=xmlData;
  }
  catch(err)
  {
    txt.value = err.message;
  }
 
}

var xmlData="";
function CreateHold()
{
  let lat = document.getElementById("lat").value;
  let lon = document.getElementById("lon").value;
  let legs = document.getElementById("legs").value;
  let radius = document.getElementById("radius").value;
  let loops = document.getElementById("loops").value;
  let status = document.getElementById("status"); 
  
  let legangle = Math.PI*2/Number(legs);
  let leglen = 2*Math.sin(legangle/2)*radius;
  
  //HoldPattern(legs,leglen,lat,lon,loops=10)
  status.value="Working: "+"HoldPattern("+concat([legs,leglen.toFixed(2),lat,lon,loops],",")+")";
  
  let txt= document.getElementById("txt");
  try 
  {
    xmlData= HoldPattern(Number(legs), Number(leglen), Number(lat), Number(lon), Number(loops));
    txt.value+=xmlData;
    BuildFilename();
  }
  catch(err) 
  {
    txt.value = err.message;
  }
}

function LatLonChange()
{
  icao="";
}

function HoldParamChange()
{
}

function Clearicao()
{
   document.getElementById("icaolookup").value="";
   icao="";
   document.getElementById("icaolookup").focus();
}

function BuildFilename()
{
  let legs = document.getElementById("legs").value;
  let radius = document.getElementById("radius").value;
  let loops = document.getElementById("loops").value;
  let fn="";
  if (icao.length==4)
    fn=concat(["Hold",icao,legs,radius,loops],"_")+".fpl";
  else 
    fn=concat(["Hold",legs,radius,loops],"_")+".fpl";
  document.getElementById("filename").value=fn;
}

function DownloadXML() 
{
  let status=document.getElementById("status");
  if (xmlData.length>50)
  {
    let fn = document.getElementById("filename").value;
    if (fn.indexOf(".")>=0)
      fn=fn.split(".")[0];
    fn+=".fpl"
    download(fn,xmlData)
    status.value=fn+" downloaded"
  }
  else
  {
    status.value="Nothing to save";
  }
}

function download(filename, text) 
{

  var element = document.createElement('a');

  element.setAttribute('href', 'data:fpl/plain;charset=utf-8,' + encodeURIComponent(text));

  element.setAttribute('download', filename);
  element.style.display = 'none';

  document.body.appendChild(element);
  element.click();

  document.body.removeChild(element);

}

function concat(arrayofstrings,separator="")
{
  let ret = "";
  let len = arrayofstrings.length;
  for(i=0;i<len;i++)
  {
    ret += arrayofstrings[i];
    if (i<(len-1))
      ret+=separator;
  }
  return ret;
}

// returns lat,lon for the sPecified sirport ICAO
function GetLatLong(icao)
{
  var ap = myAirports.filter(tst=>tst.icao==icao)
  if (ap.length==0)
    return "";
  var ll = ap[0].latitude+","+ap[0].longitude;
  return ll;
}

function verifyLatLon(latitude,longitude)
{
  if(latitude==undefined || longitude==undefined)
    return false;
  if (Math.abs(latitude)>90)
    return false;
  if (Math.abs(longitude)>180)
    return false;
  return true;
}