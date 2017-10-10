let express = require("express");
var path = require('path');
let app = express();
let mysql = require("mysql");
let bodyParser = require("body-parser");
let jsonparser = bodyParser.json();
let multer = require("multer");
let moment = require('moment');
var urlencodeder = bodyParser.urlencoded({ extended : false });
var server = require("http").Server(app);
var io = require("socket.io")(server);
let connection = mysql.createConnection({
    // host : "sql2.freesqldatabase.com",
    // user : "sql2195756",
    // password : "kD4%qS4%",
    // database : "sql2195756"
    host : "localhost",
    user : "root",
    password : "",
    database : "db_lookup_food"
});

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use('/public', express.static(path.join(__dirname + '/public')));

io.on("connection", function(socket) {
  console.log("co nguoi ket noi " + socket.id);
  socket.on("client-post-comment", function(data) {
    console.log("server nhan duoc " + data);
    io.sockets.emit("have-new-comment", data);
  });
  socket.on("change-position", function(data) {
    io.sockets.emit("change-position", data);
  });
  socket.on("post-ratting", function(data) {
    let sqlGet = "select sum(star)/count(star) as star from m_ratting where resId = " + data;
    connection.query(sqlGet, function(err, rows) {
        console.log(rows);
        io.sockets.emit("have-new-ratting", rows[0].star);
    })
  })
});
//lấy ra danh sách các trận đã đá
// app.get("/get_list_match/:id", function(req, res){
//     let id = req.params.id;
//     let sql = "select m.id, t1.team_name as team_name1, t1.image as image1, t2.image as image2, t2.team_name as team_name2, tour.tournament_name, day(m.time) as day, month(m.time) as mt, m.ratio";
//     sql += " from tbl_match as m join tbl_team as t1 on m.team1 = t1.id";
//     sql += " join tbl_team as t2 on m.team2 = t2.id";
//     sql += " join tbl_tournament as tour on m.tid = tour.id";
//     sql += " where m.statut = 1 ";
//     sql += " and tour.id = "+id;
//     sql += " order by m.time desc limit 4";
//     connection.query("select m.id, t1.team_name as team_name1, t1.image as image1, t2.image as image2, t2.team_name as team_name2, tour.tournament_name, day(m.time) as day, month(m.time) as mt, m.ratio from tbl_match as m join tbl_team as t1 on m.team1 = t1.id join tbl_team as t2 on m.team2 = t2.id join tbl_tournament as tour on m.tid = tour.id  where m.statut = 1 and tour.id = "+id+" order by m.time desc limit 4", function(err, rows, filed){
//         res.json(rows);
//     });
// });
//lấy ra trận đấu sắp đá của ngày gần nhất theo từng giải đấu
app.get("/get_match/:id", function(req, res){
    let id = req.params.id;
    let sql = "select m.id, m.time, t1.team_name as team_name1, t1.image as image1, t2.image as image2, t2.team_name as team_name2, tour.tournament_name, day(m.time) as day, month(m.time) as mt, m.ratio ";
    sql += " from tbl_match as m join tbl_team as t1 on m.team1 = t1.id ";
    sql += " join tbl_team as t2 on m.team2 = t2.id ";
    sql += " join tbl_tournament as tour on m.tid = tour.id  ";
    sql += " where m.delete_statut = 0 ";
    sql += " and m.statut = 0 ";
    sql += " and tour.id = "+id+" ";
    sql += " order by m.time asc limit 4";
    connection.query(sql, function(err, rows, filed){
        res.json(rows);
    });
});
//lấy ra danh sách và điểm các đội bóng theo giải đấu và năm của giải đấu
app.get("/get_list_team/:id_tournament/:year", function(req, res){
    let id_tournament = req.params.id_tournament;
    let year = req.params.year;
    let sql = "select team_name, score ";
    sql += " from tbl_rank ra, tbl_team t ";
    sql += " where ra.id_team = t.id_team ";
    sql += " and id_tournament ="+id_tournament+" ";
    sql += " and year="+year;
    connection.query(sql, function(err, rows, filed){
        res.json(rows);
    });
});
//lấy ra danh sách các giải đấu
app.get("/list_tournament", function(req, res){
    connection.query("Call Get_tournament", function(err, rows, filed){
        res.json(rows[0]);
    });
});
//lấy ra chi tiết trận đấu theo id trận
app.get("/detail_match/:id_match", function(req, res){
    let id_match = req.params.id_match;
    let sql = "select detail ";
    sql += " from tbl_match ";
    sql += " where id_match="+id_match;
    connection.query(sql, function(err, rows, filed){
        res.json(rows);
    });
});
//lấy ra danh sách cầu thủ theo đội bóng
app.get("/list_player/:id_team", function(req, res){
    let id_team = req.params.id_team;
    let sql = "select footballer_name ";
    sql += " from tbl_footballer ";
    sql += " where id_team="+id_team;
    connection.query(sql, function(err, rows, filed){
        res.json(rows);
    });
});
//lấy danh sách năm
app.get("/year", function(req, res){
    let sql = "select year ";
    sql += " from tbl_rank ";
    sql += " group by year";
    connection.query(sql, function(err, rows, filed){
        res.json(rows);
    });
});
app.get("/list_tournament/:idTournament", function(req, res){
    let id = req.params.idTournament;
    let sql = "select * ";
    sql += " from tbl_rank r join tbl_team t on r.teid = t.id ";
    sql += " and r.tid = "+id+" ";
    sql += " order by score desc";
    connection.query(sql, function(err, rows, filed){
        res.send(rows);
    });
});
//lấy danh sách trận đấu theo giải đấu
app.get("/listoftournament/:tournament_name", function(req, res){
    const name = req.params.tournament_name;
    connection.query("CALL getById('"+name+"')", function(err, rows, filed){
        res.send(rows[0]);
    });
});
//lấy ra vòng đấu của từng giải đấu
app.get("/listRound/:tournament_name", function (req, res) {
    let name = req.params.tournament_name;
    let sql = "select DISTINCT m.round ";
    sql += " from tbl_match as m ";
    sql += " where m.tid = (select id from tbl_tournament where tournament_name like N'"+name+"')";
    connection.query(sql, function (err, rows, filed) {
    res.json(rows);
});
});
//lấy ra mùa giải của từng giải đấu
app.get("/listSeason/:tournament_name", function (req, res) {
    let name = req.params.tournament_name;
    let sql = "select DISTINCT s.id id,season ";
    sql += " from tbl_match as m, tbl_season s ";
    sql += " where m.sid = s.id ";
    sql += " and m.tid = (select id from tbl_tournament where tournament_name like '"+name+"')";
    connection.query(sql, function (err, rows, filed) {
        res.json(rows);
    });
});
//lấy ra danh sách trận theo vòng đấu và mùa giải của từng giải đấu
app.get("/listMatch/:tournament_name/:season/:round", function (req, res) {
    const name = req.params.tournament_name;
    const season = req.params.season;
    const round = req.params.round;
    let sql = "select m.id, t1.team_name as team_name1, t1.image as image1, t2.image as image2, t2.team_name as team_name2, tour.tournament_name, day(m.time) as day, month(m.time) as mt, m.ratio ";
    sql += " from tbl_match as m join tbl_team as t1 on m.team1 = t1.id ";
    sql += " join tbl_team as t2 on m.team2 = t2.id ";
    sql += " join tbl_tournament as tour on m.tid = tour.id  ";
    sql += " where tour.tournament_name like '"+name+"' ";
    sql += " and m.round = "+round+" ";
    sql += " and m.sid = "+season+" ";
    sql += " order by tour.tournament_name, m.time";
    connection.query(sql, function (err, rows, filed) {
        res.json(rows);
    });
});
//
app.get("/NumRound/:tournament_name", function (req, res) {
    let name = req.params.tournament_name;
    let sql = "select numround, nowround ";
    sql += " from tbl_tournament ";
    sql += " where tournament_name like'"+name+"'";
    connection.query(sql, function (err, rows, filed) {
        res.json(rows);
    });
});
app.get("/Team/:name", function(req, res){
    let name = req.params.name;
    let sql = "select * ";
    sql += " from tbl_team ";
    sql += " where team_name like '"+name+"'";
    connection.query(sql, function (err, rows, filed) {
        res.json(rows);
    })
});
app.get("/ListFootballer/:Teamname", function(req, res){
    let name = req.params.Teamname;
    let sql = "select * ";
    sql += "from tbl_footballer ";
    sql += "where teid = (select id from tbl_team where team_name like '"+name+"')";
    connection.query(sql, function (err, rows, filed) {
        res.json(rows);
    })
});
app.get("/Alistmatch/:from/:record_per_page", function (req, res) {
    let from = req.params.from;
    let record_per_page = req.params.record_per_page;
    let sql = "select s.season, m.id, m.time time, m.arbitration, m.footballfield ,m.round, t1.team_name as team_name1, t2.team_name as team_name2, tour.tournament_name, m.ratio ";
    sql += "from tbl_match as m join tbl_team as t1 on m.team1 = t1.id ";
    sql += "join tbl_team as t2 on m.team2 = t2.id ";
    sql += "join tbl_tournament as tour on m.tid = tour.id ";
    sql += "join tbl_season s on s.id = m.sid ";
    sql += "where m.delete_statut = 0 ";
    sql +="order by m.id desc limit "+from+", "+record_per_page;
    connection.query(sql, function(err, rows, field){
        res.json(rows);
    })
});
app.get("/Countlistmatch", function (req, res) {
    let sql = "select count(*) as dem ";
    sql += " from tbl_match ";
    sql += " where delete_statut=0";
    connection.query(sql, function(err, rows, fields){
        res.json(rows);
    })
});
app.get("/AlistTeam/:from/:record_per_page", function (req, res) {
    let from = req.params.from;
    let record_per_page = req.params.record_per_page;
    let sql = "select * ";
    sql += " from tbl_team ";
    sql += " where delete_statut = 0 ";
    sql += " order by id desc";
    sql += " limit "+from+", "+record_per_page;
    connection.query(sql, function(err, rows, fields){
        res.json(rows);
    })
});
app.get("/CountlistTeam", function (req, res) {
    let sql = "select count(*) as dem ";
    sql += " from tbl_team ";
    sql += " where delete_statut = 0";
    connection.query(sql, function(err, rows, fields){
        res.json(rows);
    })
});
app.get("/matchinfor/:id", function (req, res) {
    let id = req.params.id;
    let sql = "select m.id, t1.team_name as team_name1, t1.image as image1, t2.image as image2, t2.team_name as team_name2, tour.tournament_name, day(m.time) as day, month(m.time) as mt, m.ratio ";
    sql += " from tbl_match as m join tbl_team as t1 on m.team1 = t1.id";
    sql += " join tbl_team as t2 on m.team2 = t2.id ";
    sql += " join tbl_tournament as tour on m.tid = tour.id  ";
    sql += " where m.id = "+id+" ";
    sql += " order by tour.tournament_name, m.time";
    connection.query(sql, function(err, rows, field){
        res.json(rows);
    })
});
app.post("/deleteTeam", jsonparser, function (req, res) {
    let id = req.body.id;
    let sql = "update tbl_team ";
    sql += " set delete_statut = 1 ";
    sql += " where id = "+id;
    connection.query(sql);
    res.end();
});
app.post("/deleteMatch", jsonparser, function (req, res) {
    let id = req.body.id;
    let sql = "update tbl_match ";
    sql += " set delete_statut = 1 ";
    sql += " where id = "+id;
    connection.query(sql);
    res.end();
});
let storage = multer.diskStorage({
    destination : function(req, file, cb){
        "use strict";
        cb(null, 'C:/xampp/htdocs/work/public/images');
        cb(null, './public/images');
    },
    filename: function (req, file, cb) {
        let d = new Date();
        let n = d.getTime();
        path = n+file.originalname;
        cb(null, path);
    }
});
//update team
const upload = multer({ storage : storage });
app.post("/api/upload/image", upload.single('file'),jsonparser, (req, res) => {
    let image = "http://127.0.0.1/work/public/images/"+path;
    console.log(image);
    //console.log(team);
    //connection.query("update tbl_team set team_name = '"+team+"', coach = '"+coach+"', image = '"+image+"', website = '"+website+"', address = '"+address+"', phone = '"+phone+"', fax = '"+fax+"' where id = "+id);
    //connection.query("update tbl_team set team_name = '"+team+"', coach = '"+coach+"',image = '"+image+"', website = '"+website+"', address = '"+address+"', phone = '"+phone+"', fax = '"+fax+"' where id = "+id);
    res.send(image);
    //console.log(req.file);
    //res.status(200).send( true );
});



app.post("/addteam", upload.single('file'),jsonparser, (req, res) => {
    let team = req.body.newTeam;
    let coach = req.body.newCoach;
    let image = req.body.newimage;
    let website = req.body.newwebsite;
    let address = req.body.newaddress;
    let phone = req.body.newphone;
    let fax = req.body.newfax;
    if(image != ""){
        image = "img/"+path;
        let sql = "INSERT INTO tbl_team (team_name, coach, image, website, address, phone, fax) ";
        sql += "VALUES ('"+team+"', '"+coach+"', '"+image+"', '"+website+"', '"+address+"', '"+phone+"', '"+fax+"')";
        connection.query(sql);
    }
    else {
        let sql = "INSERT INTO tbl_team (team_name, coach, website, address, phone, fax) ";
        sql += "VALUES ('"+team+"', '"+coach+"', '"+website+"', '"+address+"', '"+phone+"', '"+fax+"')";
        connection.query(sql);
    }
    //console.log(team);
    //connection.query("update tbl_team set team_name = '"+team+"', coach = '"+coach+"', image = '"+image+"', website = '"+website+"', address = '"+address+"', phone = '"+phone+"', fax = '"+fax+"' where id = "+id);
    //connection.query("update tbl_team set team_name = '"+team+"', coach = '"+coach+"',image = '"+image+"', website = '"+website+"', address = '"+address+"', phone = '"+phone+"', fax = '"+fax+"' where id = "+id);
    res.end();
    //console.log(req.file);
    //res.status(200).send( true );
});
//chi tiết đội
app.get("/detailTeam/:id", function (req, res) {
   let id = req.params.id;
   let sql = "select * ";
   sql += " from tbl_team ";
   sql += " where id = "+id;
   connection.query(sql, function (err, rows, fields) {
       res.json(rows);
   })
});
//chi tiết trận đấu
app.get("/detailMatch/:id", function (req, res) {
    let id = req.params.id;
    let sql = "select m.statut, s.id sid, tour.id tid, t1.id id1, t2.id id2, s.season, m.ratio, m.round,m.id,m.time,m.arbitration,m.footballfield,t1.team_name team1, tour.numround, tour.tournament_name, t2.team_name team2 ";
    sql += " from tbl_match m JOIN tbl_team t1 on m.team1 = t1.id ";
    sql += " JOIN tbl_team t2 on m.team2 = t2.id ";
    sql += " JOIN tbl_season s on m.sid = s.id ";
    sql += " JOIN tbl_tournament tour on m.tid = tour.id ";
    sql += " where m.id = " + id;
    connection.query(sql, function (err, rows, field) {
        res.json(rows);
    })
});
app.get("/listseason", function (req, res) {
    connection.query("select * from tbl_season", function (err, rows, fields) {
        res.json(rows);
    })
});
app.get("/listteam", function (req, res) {
    let sql = "select team_name, id ";
    sql += " from tbl_team ";
    sql += " where delete_statut = 0";
    connection.query(sql, function (err, rows, fields) {
        res.json(rows);
    })
});
app.get("/listtournament", function (req, res) {
    let sql = "select tournament_name, numround, id ";
    sql += " from tbl_tournament";
    connection.query(sql, function (err, rows, fields) {
        res.json(rows);
    })
});
app.get("/countround/:id_tournament", function (req, res) {
    let id = req.params.id_tournament;
    let sql = "select numround ";
    sql += " from tbl_tournament ";
    sql += " where id = "+id;
    connection.query(sql, function (err, rows, fields) {
        res.json(rows);
    })
});
app.post("/editmatch", jsonparser, (req, res) => {
    let id = req.body.id;
    let team1 = req.body.team1;
    let ratio = req.body.ratio;
    let team2 = req.body.team2;
    let tournament = req.body.tournament;
    let time = req.body.time;
    let season = req.body.season;
    let round = req.body.round;
    let statut = req.body.statut;
    let sql = "update tbl_match ";
    sql += " set team1 = "+team1+",";
    sql += " ratio = '"+ratio+"', ";
    sql += " team2 = "+team2+", ";
    sql += " tid = "+tournament+", ";
    sql += " sid = "+season+", ";
    sql += " time = '"+time+"', ";
    sql += " round = "+round+", ";
    sql += " statut = "+statut+" ";
    sql += " where id = "+id;
    connection.query(sql);
    //console.log(team);
    //connection.query("update tbl_team set team_name = '"+team+"', coach = '"+coach+"', image = '"+image+"', website = '"+website+"', address = '"+address+"', phone = '"+phone+"', fax = '"+fax+"' where id = "+id);
    //connection.query("update tbl_team set team_name = '"+team+"', coach = '"+coach+"',image = '"+image+"', website = '"+website+"', address = '"+address+"', phone = '"+phone+"', fax = '"+fax+"' where id = "+id);
    res.end();
    //console.log(req.file);
    //res.status(200).send( true );
});
app.post("/addMatch", jsonparser, (req, res) => {
    let team1 = req.body.team1;
    let ratio = req.body.ratio;
    let team2 = req.body.team2;
    let tid = req.body.tournament;
    let time = req.body.time;
    let sid = req.body.season;
    let round = req.body.round;
    let statut = req.body.statut;
    let sql = "insert into tbl_match(team1, ratio, team2, sid, tid, time, round, statut) ";
    sql += " values( "+team1+", '"+ratio+"', "+team2+", "+sid+", "+tid+", '"+time+"', "+round+", "+statut+")";
    connection.query("insert into tbl_match(team1, ratio, team2, sid, tid, time, round, statut) values( "+team1+", '"+ratio+"', "+team2+", "+sid+", "+tid+", '"+time+"', "+round+", "+statut+")");
    //console.log(team);
    //connection.query("update tbl_team set team_name = '"+team+"', coach = '"+coach+"', image = '"+image+"', website = '"+website+"', address = '"+address+"', phone = '"+phone+"', fax = '"+fax+"' where id = "+id);
    //connection.query("update tbl_team set team_name = '"+team+"', coach = '"+coach+"',image = '"+image+"', website = '"+website+"', address = '"+address+"', phone = '"+phone+"', fax = '"+fax+"' where id = "+id);
    res.end();
    //console.log(req.file);
    //res.status(200).send( true );
});
app.get("/DiffrentTeam/:id", function(req, res){
    "use strict";
   let id = req.params.id;
   let sql = "select team_name, id ";
   sql += " from tbl_team ";
   sql += " where delete_statut = 0 ";
   sql += "and id <> "+id;
   connection.query(sql, function (err, rows, fields) {
       res.json(rows);
   })
});
app.post("/login", jsonparser, function (req, res) {
   let username = req.body.username;
   let sql = "select * ";
   sql += " from m_user ";
   sql += " where username like '"+username+"' and type=1";
   connection.query(sql, function (err, rows, fields) {
       res.json(rows);
   })
});
app.get("/SearchTeam/:name/:from/:perpage", function(req, res){
    "use strict";
    let team_name = req.params.name;
    let from = req.params.from;
    let perpage = req.params.perpage;
    let sql = "select * from tbl_team ";
    sql += "where delete_statut = 0 ";
    sql += "and team_name like '%"+team_name+"%' limit "+from+", "+perpage;
    connection.query(sql, function (err, rows, fields) {
        res.json(rows);
    })
});
app.get("/CountSearch/:name", function (req, res) {
    let team_name = req.params.name;
    connection.query("select count(*) as dem from tbl_team where delete_statut = 0 and team_name like '%"+team_name+"%'", function(err, rows, fields){
        res.json(rows);
    })
});
app.get("/getMatchofTour/:tid", function (req, res) {
    let tid = req.params.tid;
    let sql = "select m.id, m.time, t1.team_name as team_name1, t1.image as image1, t2.image as image2, t2.team_name as team_name2, tour.tournament_name, day(m.time) as day, month(m.time) as mt, m.ratio ";
    sql += " from tbl_match m join tbl_team t1 on m.team1 = t1.id";
    sql += " join tbl_team t2 on m.team2 = t2.id";
    sql += " join tbl_tournament tour on m.tid = tour.id ";
    sql += "where m.tid = "+tid+" and statut = 0 order by m.time limit 4";
    connection.query(sql, function (err, rows, fields) {
        res.json(rows);
    })

});
app.get("/matchOftour", function (req, res) {
    var arr = [];
   connection.query("select * from tbl_tournament", function (err, rows, fields) {
       for(let i =0; i<rows.length; i++){
           let sql = "select tour.id tid, m.id, m.time, t1.team_name as team_name1, t1.image as image1, t2.image as image2, t2.team_name as team_name2, tour.tournament_name, day(m.time) as day, month(m.time) as mt, m.ratio ";
           sql += " from tbl_match m join tbl_team t1 on m.team1 = t1.id";
           sql += " join tbl_team t2 on m.team2 = t2.id";
           sql += " join tbl_tournament tour on m.tid = tour.id ";
           sql += "where m.tid = "+rows[i].id+" and statut = 0 and m.delete_statut = 0 order by m.time limit 4";
           connection.query(sql, function (err, rows, fields) {
               arr.push(rows);
           });

       }
       setTimeout(() => {res.json(arr)}, 200);
   })
});
app.get("/resultsOftour", function (req, res) {
    var arr = [];
    connection.query("select * from tbl_tournament", function (err, rows, fields) {
        for(let i =0; i<rows.length; i++){
            let sql = "select tour.id tid, m.id, m.time, t1.team_name as team_name1, t1.image as image1, t2.image as image2, t2.team_name as team_name2, tour.tournament_name, day(m.time) as day, month(m.time) as mt, m.ratio ";
            sql += " from tbl_match m join tbl_team t1 on m.team1 = t1.id";
            sql += " join tbl_team t2 on m.team2 = t2.id";
            sql += " join tbl_tournament tour on m.tid = tour.id ";
            sql += "where m.tid = "+rows[i].id+" and statut = 1 and m.delete_statut = 0 order by m.time DESC limit 4";
            connection.query(sql, function (err, rows, fields) {
                arr.push(rows);
            });

        }
        setTimeout(() => {res.json(arr)}, 200);
    })
});
app.get("/tournamentdetail/:id", function(req, res){
    let id = req.params.id;
    connection.query("select * from tbl_tournament where id = "+id, function (err, rows, fields) {
        res.json(rows);
    })
});
app.post("/edittournament", jsonparser, function (req, res) {
   let id = req.body.id;
   let nowround = req.body.NowRound;
   connection.query("update tbl_tournament set nowround = "+nowround+" where id = "+id);
   res.end();
});
app.post("/addtournament", jsonparser, function (req, res) {
    let tournament_name = req.body.Tournament_name;
    let nowround = req.body.NowRound;
    let numround = req.body.NumRound;
    connection.query("insert into tbl_tournament(tournament_name, numround, nowround) values('"+tournament_name+"', "+nowround+", "+numround+") ");
    res.end();
});
app.get("/SearchMatch/:team_name/:from/:record_per_page", function (req, res) {
    let team_name = req.params.team_name;
    let from = req.params.from;
    let record_per_page = req.params.record_per_page;
    let sql = "select s.season, m.id, m.time time, m.arbitration, m.footballfield ,m.round, t1.team_name as team_name1, t2.team_name as team_name2, tour.tournament_name, m.ratio ";
    sql += "from tbl_match as m join tbl_team as t1 on m.team1 = t1.id ";
    sql += "join tbl_team as t2 on m.team2 = t2.id ";
    sql += "join tbl_tournament as tour on m.tid = tour.id ";
    sql += "join tbl_season s on s.id = m.sid ";
    sql += "where m.delete_statut = 0 ";
    sql += " and (t1.team_name like '%"+team_name+"%' or t2.team_name like '%"+team_name+"%')";
    sql +="order by m.id desc limit "+from+", "+record_per_page;
    connection.query(sql, function(err, rows, field){
        res.json(rows);
    })
});
app.get("/CountSearchMatch/:team_name", function (req, res) {
    let team_name = req.params.team_name;
    let from = req.params.from;
    let record_per_page = req.params.record_per_page;
    let sql = "select count(*) as dem ";
    sql += "from tbl_match as m join tbl_team as t1 on m.team1 = t1.id ";
    sql += "join tbl_team as t2 on m.team2 = t2.id ";
    sql += "join tbl_tournament as tour on m.tid = tour.id ";
    sql += "join tbl_season s on s.id = m.sid ";
    sql += "where m.delete_statut = 0 ";
    sql += " and (t1.team_name like '%"+team_name+"%' or t2.team_name like '%"+team_name+"%')";
    connection.query(sql, function(err, rows, field){
        res.json(rows);
    })
});

app.post("/api/post/user", jsonparser, function (req, res) {
    let fbId = req.body.id;
    let fbName = req.body.name;
    let fbPicture = req.body.picture.data.url;
    let fbCover = req.body.cover ? req.body.cover.source : '';
    let sqlCheck = "select * from m_user where fbId = '" + fbId + "'";
    console.log(sqlCheck);
    connection.query(sqlCheck, function(err, rows){
      if(rows.length == 0){
        let sqlInsert = "insert into m_user(fbId, fbName, picture, cover) values(" + fbId + ", '" + fbName + "', '" + fbPicture + "', '" + fbCover + "')";
        console.log(sqlInsert);
        connection.query(sqlInsert);
      }
      else{
        if(rows[0].fbName !== fbName || rows[0].picture !== fbPicture || rows[0].cover !== fbCover){
            let sqlUpdate = "update m_user set fbName = '" + fbName + "', picture = '" + fbPicture + "', cover = '" + fbCover + "' where fbId = " + fbId;
            connection.query(sqlUpdate);  
        }
      }
    });
    res.end();
});

app.post("/api/post/comment", jsonparser, function (req, res) {
    let fbId = req.body.fbId;
    let resId = req.body.resId;
    let comment = req.body.comment;
    let sqlGetUId = "select id from m_user where fbId = " + fbId;
    connection.query(sqlGetUId, function(err, rows){
      if(rows.length > 0){
        let sqlInsert = "insert into m_comment(uId, resId, commentDescription) values(" + rows[0].id + ", " + resId + ", '" + comment + "')";
        connection.query(sqlInsert);
      }
    });
    res.end();
});

app.get("/api/get/user", function (req, res) {
    let sqlCheck = "select * from m_user";
    connection.query(sqlCheck, function(err, rows){
        res.json(rows);
    });
});

app.get("/api/get/restaurant", function (req, res) {
  let sql = "select id, name, latitude, longitude, minPrices, maxPrices, open, close, address, photoUrl, phone from m_restaurant order by id DESC";
  //res.send(sql);
  connection.query(sql, function(err, rows){
    res.json(rows);
  })
});

app.get("/api/get/restaurant/:from/:to", function (req, res) {
  let from = req.params.from;
  let to = req.params.to;
  let sql = "select id, name, latitude, longitude, minPrices, maxPrices, open, close, address, photoUrl, phone from m_restaurant order by createAt DESC limit " + from + ", " + to;
  connection.query(sql, function(err, rows){
    res.json(rows);
  })
});

app.get("/api/get/comment/:idRestaurant", function(req, res){
  let resId = req.params.idRestaurant;
  let sql = "select cmt.id, u.fbName, u.picture, cmt.commentDescription, cmt.uId, cmt.resId from m_comment as cmt JOIN m_user as u on cmt.uId = u.id JOIN m_restaurant res on cmt.resId = res.id where cmt.resId = " + resId + " order by cmt.createdAt DESC limit 2";
  connection.query(sql, function(err, rows){
    res.json(rows);
  })
});

app.post("/api/delete/comment", jsonparser,  function(req, res){
  let id = req.body.id;
  let sql = "delete from m_comment where id = " + id;
  connection.query(sql, function(err, rows){
    if(err){
        res.send("error");
    }
    else{
        res.send("ok");
    }
  })
});

app.get("/api/get/comment/new/:idRestaurant", function(req, res){
  let resId = req.params.idRestaurant;
  let sql = "select cmt.id, u.fbName, u.picture, cmt.commentDescription, cmt.uId, cmt.resId from m_comment as cmt JOIN m_user as u on cmt.uId = u.id JOIN m_restaurant res on cmt.resId = res.id where cmt.resId = " + resId + " order by cmt.createdAt DESC limit 1";
  connection.query(sql, function(err, rows){
    res.json(rows);
  })
});

app.get("/api/get/comments/:idRestaurant/:from/:to", function(req, res){
  let resId = req.params.idRestaurant;
  let from = req.params.from;
  let to = req.params.to;
  let sql = "select res.name, cmt.id, u.fbName, u.picture, cmt.commentDescription, cmt.uId, cmt.resId from m_comment as cmt JOIN m_user as u on cmt.uId = u.id JOIN m_restaurant res on cmt.resId = res.id where cmt.resId = " + resId + " order by cmt.createdAt DESC limit " + from + ", " + to;
  connection.query(sql, function(err, rows){
    res.json(rows);
  })
});

app.get("/api/count/comment/:idRestaurant", function(req, res){
  let resId = req.params.idRestaurant;
  let sql = "select count(*) as count from m_comment as cmt JOIN m_user as u on cmt.uId = u.id JOIN m_restaurant res on cmt.resId = res.id where cmt.resId = " + resId;
  connection.query(sql, function(err, rows){
    res.json(rows);
  })
});

app.get("/api/get/restaurant/:key", function(req, res){
  let sql = "select * from m_restaurant where name like '%" + req.params.key + "%'";
  connection.query(sql, function(err, rows){
    res.json(rows);
  })
});

app.get("/api/get/info/restaurant/:id", function(req, res){
  let sql = "select m_restaurant.id, m_province.name province, m_district.name district, m_ward.name ward, m_street.name street, m_restaurant.name, m_restaurant.open, m_restaurant.close, m_restaurant.latitude, m_restaurant.longitude, m_restaurant.minPrices, m_restaurant.maxPrices, m_restaurant.address, m_restaurant.phone, m_restaurant.photoUrl from m_restaurant, m_province, m_district, m_ward, m_street where m_restaurant.provinceId = m_province.id and m_restaurant.districtId = m_district.id and m_restaurant.streetId = m_street.id and m_district.provinceId = m_province.id and m_ward.provinceId = m_province.id and m_ward.districtId = m_district.id and m_street.provinceId = m_province.id and m_street.districtId = m_district.id and m_street.wardId = m_ward.id and m_restaurant.id = " + req.params.id;
  connection.query(sql, function(err, rows){
    res.json(rows);
  })
});

app.get("/api/get/admin/info/restaurant/:id", function(req, res){
  let sql = "select * from m_restaurant where id = " + req.params.id;
  connection.query(sql, function(err, rows){
    res.json(rows);
  })
});

app.get("/api/get/images/restaurant/:id/:from/:to", function(req, res){
  let sql = "select link, createAt from m_images where resId = " + req.params.id + " order by createAt DESC limit " + req.params.from + ", " + req.params.to;
  connection.query(sql, function(err, rows){
    res.json(rows);
  })
});

app.get("/api/count/images/restaurant/:id", function(req, res){
  let sql = "select count(*) as count from m_images where resId = " + req.params.id;
  connection.query(sql, function(err, rows){
    res.json(rows);
  })
});

app.get("/api/get/restaurant/near/:latitude/:longitude", function(req, res){
  //let sql = "call geoNear(" + req.params.latitude + ", " + req.params.longitude + ")";
  let sql = "select * from m_restaurant res ORDER BY SQRT(POWER((res.latitude - " + req.params.latitude + ") * 111.18, 2) + POWER((res.longitude - " + req.params.longitude + ")*96.4069, 2)) ASC";
  connection.query(sql, function(err, rows){
    res.json(rows);
  })
});

app.get("/api/get/restaurant/nearByRadius/:latitude/:longitude/:radius", function(req, res){
  //let sql = "call geoNearByRadius(" + req.params.latitude + ", " + req.params.longitude + ", " + req.params.radius + ")";
  let sql = "select * from m_restaurant res where SQRT(POWER((res.latitude - " + req.params.latitude + ") * 111.18, 2) + POWER((res.longitude - " + req.params.longitude + ")*96.4069, 2)) * 1000 <= " + req.params.radius + " LIMIT 10";
  connection.query(sql, function(err, rows){
    res.json(rows);
  })
});

app.get("/api/get/restaurants/save/:fbId", function(req, res){
  let fbId = req.params.fbId;
  let sqlGetUId = "select id from m_user where fbId = " + fbId;
    connection.query(sqlGetUId, function(err, rows){
      if(rows.length > 0){
        let getSaveRestaurant = "select m_restaurant.photoUrl, m_restaurant.latitude, m_restaurant.longitude, m_restaurant.name, m_restaurant.address, m_save.id, m_save.resId from m_restaurant, m_save where m_restaurant.id = m_save.resId and m_save.Uid = " + rows[0].id;
        connection.query(getSaveRestaurant, function(err, rows){
          res.json(rows);
        });
      }
    });
});

app.post("/api/post/savePlace", jsonparser, function (req, res) {
    let fbId = req.body.fbId;
    let resId = req.body.resId;
    let sqlGetUId = "select id from m_user where fbId = " + fbId;
    connection.query(sqlGetUId, function(err, rows){
      if(rows.length > 0){
        let sqlInsert = "insert into m_save(uId, resId) values(" + rows[0].id + ", " + resId + ")";
        connection.query(sqlInsert);
      }
    });
    res.end();
});

app.post("/api/post/removePlace", jsonparser, function (req, res) {
    let fbId = req.body.fbId;
    let resId = req.body.resId;
    let sqlGetUId = "select id from m_user where fbId = " + fbId;
    connection.query(sqlGetUId, function(err, rows){
      if(rows.length > 0){
        let sqlInsert = "delete from m_save where Uid = " + rows[0].id + " and resId = " + resId;
        connection.query(sqlInsert);
      }
    });
    res.end();
});

app.post("/api/post/ratting", jsonparser, function (req, res) {
    let fbId = req.body.fbId;
    let resId = req.body.resId;
    let star = req.body.star;
    let sqlGetUId = "select id from m_user where fbId = " + fbId;
    connection.query(sqlGetUId, function(err, rows){
      if(rows.length > 0){
        let sqlInsert = "insert into m_ratting(resId, uId, star) values(" + resId + ", " + rows[0].id + ", " + star + ")";
        connection.query(sqlInsert);
      }
    });
    res.end();
});

app.get("/api/get/ratting/:fbId/:resId", function (req, res) {
    let fbId = req.params.fbId;
    let resId = req.params.resId;
    let sqlGetUId = "select id from m_user where fbId = " + fbId;
    connection.query(sqlGetUId, function(err, rows){
      if(rows.length > 0){
        let sqlGet = "select star from m_ratting where resId = " + resId + " and uId = " + rows[0].id;
        connection.query(sqlGet, function(err, rows) {
            res.json(rows);
        })
      }
    });
});

app.get("/api/get/checkRatting/:fbId/:resId", function (req, res) {
    let fbId = req.params.fbId;
    let resId = req.params.resId;
    let sqlGetUId = "select id from m_user where fbId = " + fbId;
    connection.query(sqlGetUId, function(err, rows){
      if(rows.length > 0){
        let sqlGet = "select count(*) as count from m_ratting where resId = " + resId + " and uId = " + rows[0].id;
        connection.query(sqlGet, function(err, rows) {
            res.json(rows);
        })
      }
    });
});

app.get("/api/get/rattingTotal/:resId", function (req, res) {
    let resId = req.params.resId;
    let sqlGet = "select sum(star)/count(star) as star from m_ratting where resId = " + resId;
    connection.query(sqlGet, function(err, rows) {
        res.json(rows);
    })
});

app.get("/api/get/category/:resId", function (req, res) {
    let resId = req.params.resId;
    let sqlGet = "select m_category.name, m_category.id from m_category, m_food, m_restaurant where m_food.resId = m_restaurant.id and m_food.cateId = m_category.id and m_restaurant.id = " + resId + " GROUP by m_category.id";
    connection.query(sqlGet, function(err, rows) {
        res.json(rows);
    })
});

app.get("/api/get/food/:resId/:cateId", function (req, res) {
    let resId = req.params.resId;
    let cateId = req.params.cateId;
    let sqlGet = "select m_food.id, m_food.name, m_food.price from m_food where cateId = " + cateId + " and resId = " + resId;
    connection.query(sqlGet, function(err, rows) {
        res.json(rows);
    })
})

app.get("/api/get/admin/food/:resId/:from/:to", function (req, res) {
    let resId = req.params.resId;
    let from = req.params.from;
    let to = req.params.to;
    let sql = "select m_restaurant.name resName, m_category.name cateName, m_food.id, m_food.name, m_food.price from m_food, m_category, m_restaurant where m_food.resId = m_restaurant.id and m_food.cateId = m_category.id and resId = " + resId + " limit " + from + ", " + to;
    connection.query(sql, function(err, rows){
        res.json(rows);
    })
})

app.get("/api/count/admin/food/:resId", function (req, res) {
    let resId = req.params.resId;

    let sql = "select count(*) as count from m_food where resId = " + resId;
    connection.query(sql, function(err, rows){
        res.json(rows);
    })
})

app.get("/api/count/admin/category", function (req, res) {
    let resId = req.params.resId;
    let sql = "select count(*) as count from m_category";
    connection.query(sql, function(err, rows){
        res.json(rows);
    })
})

app.get("/api/get/admin/info/food/:id", function (req, res) {
    let id = req.params.id;
    let sql = "select * from m_food where id = " + id;
    connection.query(sql, function(err, rows){
        res.json(rows);
    })
})

app.get("/api/get/admin/info/category/:id", function (req, res) {
    let id = req.params.id;
    let sql = "select * from m_category where id = " + id;
    connection.query(sql, function(err, rows){
        res.json(rows);
    })
})

app.get("/api/get/include/category", function (req, res) {
    let sql = "select * from m_category";
    connection.query(sql, function(err, rows){
        res.json(rows);
    })
})

app.get("/api/get/include/category/:from/:to", function (req, res) {
    let from = req.params.from;
    let to = req.params.to;
    let sql = "select * from m_category limit " + from + ", " + to;
    connection.query(sql, function(err, rows){
        if(err){
            res.send("error")
        }
        else
            res.json(rows);
    })
})

app.get("/api/post/food/:resId/:cateId", function (req, res) {
    let resId = req.params.resId;
    let cateId = req.params.cateId;
    let sqlGet = "select m_food.id, m_food.name, m_food.price from m_food where cateId = " + cateId + " and resId = " + resId;
    connection.query(sqlGet, function(err, rows) {
        res.json(rows);
    })
});

app.post("/api/update/restaurant", jsonparser, function (req, res) {
    let id = req.body.id;
    let name = req.body.name;
    let address = req.body.address;
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let phone = req.body.phone;
    let minPrices = req.body.minPrices;
    let maxPrices = req.body.maxPrices;
    let open = req.body.open;
    let close = req.body.close;
    let photoUrl = req.body.photoUrl;
    let provinceId = parseInt(req.body.provinceId);
    let districtId = parseInt(req.body.districtId);
    let wardId = parseInt(req.body.wardId);
    let streetId = parseInt(req.body.streetId);
    let sql = `update m_restaurant set provinceId = ${provinceId}, districtId = ${districtId}, wardId = ${wardId}, streetId = ${streetId}, name = '${name}', address = '${address}', latitude = ${latitude}, longitude = ${longitude}, phone = '${phone}', minPrices = ${minPrices}, maxPrices = ${maxPrices}, open = '${open}', close = '${close}', photoUrl = '${photoUrl}' where id = ${id}`;
    connection.query(sql);
    res.end();
});

app.post("/api/update/food", jsonparser, function(req, res) {
    let name = req.body.name;
    let id = req.body.id;
    let price = parseInt(req.body.price);
    let cateId = parseInt(req.body.cateId);
    let sql = `update m_food set name = '${name}', price = ${price}, cateId = ${cateId} where id = ${id}`;
    connection.query(sql, function(err, rows){
        if(err){
            res.send("error");
        }
        else{
            res.send("ok");
        }
    })
});

app.post("/api/update/category", jsonparser, function(req, res) {
    let name = req.body.name;
    let id = req.body.id;
    let sql = `update m_category set name = '${name}' where id = ${id}`;
    connection.query(sql, function(err, rows){
        if(err){
            res.send("error");
        }
        else{
            res.send("ok");
        }
    })
});

app.post("/api/post/food", jsonparser, function(req, res) {
    let name = req.body.name;
    let resId = parseInt(req.body.resId);
    let price = parseInt(req.body.price);
    let cateId = parseInt(req.body.cateId);
    let sql = `insert into m_food(name, price, cateId, resId) values('${name}',${price}, ${cateId}, ${resId})`;
    connection.query(sql, function(err, rows){
        if(err){
            res.send("error");
        }
        else{
            res.send("ok");
        }
    })
});

app.post("/api/post/category", jsonparser, function(req, res) {
    let name = req.body.name;
    let sql = `insert into m_category(name) values('${name}')`;
    connection.query(sql, function(err, rows){
        if(err){
            res.send("error");
        }
        else{
            res.send("ok");
        }
    })
});

app.post("/api/post/restaurant", jsonparser, function (req, res) {
    let name = req.body.name;
    let address = req.body.address;
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let phone = req.body.phone;
    let minPrices = req.body.minPrices;
    let maxPrices = req.body.maxPrices;
    let open = req.body.open;
    let close = req.body.close;
    let photoUrl = req.body.photoUrl;
    let provinceId = req.body.provinceId;
    let districtId = req.body.districtId;
    let wardId = req.body.wardId;
    let streetId = req.body.streetId;
    let sql = `insert into m_restaurant(name, address, latitude, longitude, phone, minPrices, maxPrices, open, close, photoUrl, provinceId, districtId, wardId, streetId) values('${name}', '${address}', ${latitude}, ${longitude}, '${phone}', ${minPrices}, ${maxPrices}, '${open}', '${close}', '${photoUrl}', ${provinceId}, ${districtId}, ${wardId}, ${streetId})`;
    connection.query(sql);
    res.end();
});

app.post("/api/post/admin/delete/restaurant", jsonparser, function (req, res) {
    let id = req.body.id;
    let sql = `delete from m_restaurant where id = ${id}`;
    connection.query(sql);
    res.end();
});

app.post("/api/post/admin/delete/category", jsonparser, function (req, res) {
    let id = req.body.id;
    let sql = `delete from m_category where id = ${id}`;
    connection.query(sql, function(err, rows) {
        if(err){
            res.send("error");
        }
        else{
            res.send("ok");
        }
    });
});

app.post("/api/post/admin/delete/food", jsonparser, function (req, res) {
    let id = req.body.id;
    let sql = `delete from m_food where id = ${id}`;
    connection.query(sql);
    res.end();
});

app.post("/api/post/images/restaurant", jsonparser, function (req, res) {
    console.log(req.body);
    let id = parseInt(req.body.resId);
    let link = req.body.link;
    let values = "";
    for(let i=0; i<link.length; i++){
        if(i == link.length - 1){
            values += `(${id}, '${link[i]}');`
        }
        else
            values += `(${id}, '${link[i]}'),`
    }
    let sql = `insert into m_images(resId, link) values ${values}`;
    console.log(sql);
    connection.query(sql, function(err, row) {
        if(err){
            res.send("error");
        }
        else{
            res.send("ok");
        }
    });
});

app.get("/api/get/list/province", function(req, res) {
    let sql = "select * from m_province";
    connection.query(sql, function(err, rows) {
        res.json(rows);
    })
})

app.get("/api/get/list/district", function(req, res) {
    let sql = "select * from m_district";
    connection.query(sql, function(err, rows) {
        res.json(rows);
    })
})

app.get("/api/get/list/ward", function(req, res) {
    let sql = "select * from m_ward";
    connection.query(sql, function(err, rows) {
        res.json(rows);
    })
})

app.get("/api/get/list/street", function(req, res) {
    let sql = "select * from m_street";
    connection.query(sql, function(err, rows) {
        res.json(rows);
    })
})

app.get("/api/count/restaurant", function(req, res) {
    let sql = "select count(*) as count from m_restaurant";
    connection.query(sql, function(err, rows) {
        res.json(rows);
    })
})


app.get("/", function(req, res) {
    res.send("hello");
})

server.listen(process.env.PORT || 2000);