// node worldCup2019.js --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results --dest=teams.json --data="world Cup" --excel="world cup.csv"
let minimist=require("minimist");
let fs=require("fs");
let axios=require("axios");
let jsdom=require("jsdom");
let path=require("path");
let excel=require("excel4node");
let pdf=require("pdf-lib");

let args=minimist(process.argv);

let dprms=axios.get(args.source);

dprms.then(function(response){
    let html=response.data;
    let dom=new jsdom.JSDOM(html);

    let docum=dom.window.document;
    
    let matches=[];
    let  scoreCard=docum.querySelectorAll("div.match-score-block");
    for(let i=0;i<scoreCard.length;i++){
        let match={
        };

        // let discp=scoreCard[i].querySelector("div.description");
        // match.description=discp.textContent;
        let pname=scoreCard[i].querySelectorAll("div.name-detail > p.name");
        match.t1=pname[0].textContent;
        match.t2=pname[1].textContent;

        let pscore=scoreCard[i].querySelectorAll("div.score-detail>span.score");
        if(pscore.length==2){
            match.t1s=pscore[0].textContent;
            match.t2s=pscore[1].textContent;
        }
        else if(pscore.length==1){
            match.t1s=pscore[0].textContent;
            match.t2s="";
        }
        else{
            match.t1s="";
            match.t2s="";
        }

        let status=scoreCard[i].querySelector("div.status-text");

        match.result=status.textContent;

        matches.push(match);

    }

    let teams=[];

    for(let i=0;i<matches.length;i++){
        let teamF=matches[i];
        getTeams(teamF,teams);
    }

   for(let i=0;i<matches.length;i++){
       let teamf=matches[i];

       getMatches(teamf,teams);
   }
   

   let jteams=JSON.stringify(teams);

   fs.writeFileSync(args.dest,jteams,"utf-8");

   createExcelFile(teams);
   createFolder(teams);


    
    


}).catch(function(err){
    console.log("There is something wrong with the provided url");
})

function getTeams(teamF,teams){
    let indx1=-1;
    for(let i=0;i<teams.length;i++){
        if(teams[i].name==teamF.t1){
            indx1=i;
            break;
        }
    }

    if(indx1==-1){
        teams.push({
            name: teamF.t1,
            matches: []
            
        });

    }
    let indx2=-1;
    for(let i=0;i<teams.length;i++){
        if(teams[i].name==teamF.t2){
            indx2=i;
            break;
        }
    }

    if(indx2==-1){
        teams.push({
            name: teamF.t2,
            matches: []
        });
    }

}

function getMatches(teamF,teams){
    let indx1=-1;
    for(let i=0;i<teams.length;i++){
        if(teams[i].name==teamF.t1){
            indx1=i;
            break;
        }
    }

    if(indx1!=-1){
        teams[indx1].matches.push({
            vs: teamF.t2,
            selfScore: teamF.t1s,
            oppScore: teamF.t2s,
            result: teamF.result

        })
    }

    let indx2=-1;
    for(let i=0;i<teams.length;i++){
        if(teams[i].name==teamF.t2){
            indx2=i;
            break;
        }
    }

    if(indx2!=-1){
        teams[indx2].matches.push({
            vs: teamF.t1,
            selfScore: teamF.t2s,
            oppScore: teamF.t1s,
            result: teamF.result

        })
    }
}

function createExcelFile(teams){
    let wb=new excel.Workbook();
    let style=wb.createStyle({
        font: {
            color: '#FF0800',
            size: 12,
            bold: true
        }
    })
    for(let i=0;i<teams.length;i++){
        let ws=wb.addWorksheet(teams[i].name);

        ws.cell(1,1).string("Team").style(style);
        ws.cell(1,2).string("opponent").style(style);
        ws.cell(1,3).string("oppScore").style(style);
        ws.cell(1,4).string("selfScore").style(style);
        ws.cell(1,5).string("result").style(style);

        for(let j=0;j<teams[i].matches.length;j++){
            ws.cell(2+j,2).string(teams[i].matches[j].vs);
            ws.cell(2+j,3).string(teams[i].matches[j].oppScore);
            ws.cell(2+j,4).string(teams[i].matches[j].selfScore);
            ws.cell(2+j,5).string(teams[i].matches[j].result);
        }
    }

    wb.write(args.excel);
}

function createFolder(teams){
    fs.mkdirSync(args.data);
    for(let i=0;i<teams.length;i++){
        
        let folder=path.join(args.data,teams[i].name);
        fs.mkdirSync(folder);

        for(let j=0;j<teams[i].matches.length;j++){
            let matchFile=path.join(folder,teams[i].matches[j].vs+".pdf");
            createScoreCard(matchFile,teams[i].name,teams[i].matches[j]);
        }
    }

}

function createScoreCard(matchfile,name,matches){
    let t1=name;
    let t2=matches.vs;
    let t1s=matches.selfScore;
    let t2s=matches.oppScore;
    let result=matches.result;

    let docBytes=fs.readFileSync("scoreCard.pdf");
        let pdfDocpro = pdf.PDFDocument.load(docBytes);

    pdfDocpro.then(function(pdfDoc){
        let pages=pdfDoc.getPages();
        let page=pages[0];

       
        page.drawText(t1,{
            x: 400,
            y: 590,
            size: 14
        });

        page.drawText(t2,{
            x: 400,
            y: 545,
            size: 14
        });

        page.drawText(t1s,{
            x: 400,
            y: 495,
            size: 14
        });

        page.drawText(t2s,{
            x: 400,
            y: 445,
            size: 14
        });

        page.drawText(result,{
            x: 140,
            y: 352,
            size: 14
        });

        let pdfpro=pdfDoc.save();
        pdfpro.then(function(finalPdf){
            fs.writeFileSync(matchfile,finalPdf);
        })

    })
    
}





