const userList = document.querySelector('.guides');
const betList = document.querySelector('#bet-list');
const loggedOutLinks = document.querySelectorAll('.logged-out');
const loggedInLinks = document.querySelectorAll('.logged-in');
const accountDetails = document.querySelector('.account-details');
const adminItems = document.querySelectorAll('.admin');
const betStats = document.querySelector('#bet-stats');
const owedStats = document.querySelector('#owed-stats');
const resolvedList = document.querySelector('#resolved-list');
const resolvedStats = document.querySelector('#resolved-stats');

const setupUI = (user) => {
  if(user){
    if(user.admin){
      adminItems.forEach(item => item.style.display = 'block');
    }
    //account info
    db.collection('userz').doc(user.uid).get().then(doc => {
      const html = `
        <div>Logged in as ${user.email}</div>
        <div>${doc.data().name}</div>
        <div>Congrats Received: ${doc.data().congrats}</div>
      `;
      accountDetails.innerHTML = html;
    });

    //toggle UI elements
    loggedInLinks.forEach(item => item.style.display = 'block');
    loggedOutLinks.forEach(item => item.style.display = 'none');
  }else{
    adminItems.forEach(item => item.style.display = 'none');
    //hide account info
    accountDetails.innerHTML = '';
    //toggle UI elements
    loggedInLinks.forEach(item => item.style.display = 'none');
    loggedOutLinks.forEach(item => item.style.display = 'block');
  }
}

//setup users
const setupUsers = (userDocs,owedDocs) => {
  




  if(userDocs.length){

    var ballzOwed = 0;
    owedDocs.forEach(owedDoc => {
        ballzOwed += owedDoc.data().amount;
    });
    owedHtml = `<h5 class="center-align">Total Balls Owed: ${ballzOwed}</h5>`
    owedStats.innerHTML = owedHtml;


    let html = '';
    let optionshtml = `<option value="" disabled selected>User</option>`;
    userDocs.forEach(doc => {

        var balance = 0;
        var textList = [];
        const userData = doc.data();
        const userID = doc.id;
        var postivieList = [];
        var negativeList = [];

        optionshtml += `<option value="${userID}">${userData.name}</option>`

        var owedToRecords = owedDocs.filter( function(owedDocs){return (owedDocs.data().owed.id == userID);} );

        owedToRecords.forEach(owedToRecord =>{
            var owedByArray = userDocs.filter(function(userDocs){return (userDocs.id == owedToRecord.data().owedBy.id);});
            var owedBy = owedByArray[0].data().name;
            var owedTo = doc.data().name;
            var amount = parseInt(owedToRecord.data().amount);
            var text;
            if(amount > 0){
                text = owedBy + " owes " + owedTo + " " + amount + " cheese balls";
                postivieList.push(text);
            }else if (amount < 0){
                text = owedTo + " owes " + owedBy + " " + amount*-1 + " cheese balls";
                negativeList.push(text);
            }
            balance += amount;
        })

        var owedRecords = owedDocs.filter( function(owedDocs){return (owedDocs.data().owedBy.id == userID);} );

        owedRecords.forEach(owedRecord =>{
            var owedArray = userDocs.filter(function(userDocs){return (userDocs.id == owedRecord.data().owed.id);});
            var owedTo = owedArray[0].data().name;
            var owedBy = doc.data().name;
            var amount = parseInt(owedRecord.data().amount);
            var text;
            if(amount > 0){
                text = owedBy + " owes " + owedTo + " " + amount + " cheese balls";
                negativeList.push(text);
            }else if(amount < 0){
                text = owedTo + " owes " + owedBy + " " + amount*-1 + " cheese balls";
                postivieList.push(text);
            }
            balance -= amount;
        })

        if(negativeList.length == 0 && postivieList.length == 0){
            textList.push(`<div class="collapsible-body white">No balls owed or owed to</div>`);   
        }else{
            postivieList.forEach(posText => {
                textList.push(`<div class="collapsible-body white blue lighten-1">${posText}</div>`);
            })
            negativeList.forEach(negText => {
                textList.push(`<div class="collapsible-body white red lighten-1">${negText}</div>`);
            })
        }

        var li = `
        <li>
            <div class="collapsible-header grey lighten-4">${userData.name}: ${balance}</div>
        `;

        textList.forEach(text => {
            li += text;
        });

        li += `</li>`;

        html += li;
    });



    var elems = document.querySelector('#user1Select');
    var elems2 = document.querySelector('#user2Select');
    var elems3 = document.querySelector('#numberSelect');
    var elems4 = document.querySelector('#numberPaid');
    var elems5 = document.querySelector('#user1Record');
    var elems6 = document.querySelector('#user2Record');

    elems.innerHTML = optionshtml;
    elems2.innerHTML = optionshtml;
    elems5.innerHTML = optionshtml;
    elems6.innerHTML = optionshtml;

    var instances = M.FormSelect.init(elems);
    var instances2 = M.FormSelect.init(elems2);
    var instances3 = M.FormSelect.init(elems3);
    var instances4 = M.FormSelect.init(elems4);
    var instances5 = M.FormSelect.init(elems5);
    var instances6 = M.FormSelect.init(elems6);

   

    userList.innerHTML = html;
}else{
  userList.innerHTML = '<h5 class="center-align">Login to view cheese balls</h5>';
  owedStats.innerHTML = '';
}

}


//setup bets
const setupBets = (betDocs,userDocs,currentUser) => {
    //console.log(currentUser.uid);
        if(betDocs.length){
            var totalBets = 0;
            var totalBallsBet = 0;
            db.collection('userz').doc(currentUser.uid).get().then(currentUser => {    

            let html = '';

            betDocs.forEach(betDoc => {
                if(betDoc.data().active == true){
                var date = betDoc.data().activeDate;
                var activeDate;
                if (date == null){
                    activeDate = new Date(2010,0,1);
                }else{
                    activeDate = new Date(date.seconds*1000);
                }
                totalBets++;
                totalBallsBet += betDoc.data().amount;
                }
                if(betDoc.data().active && (betDoc.data().user1.id == currentUser.id || betDoc.data().user2.id == currentUser.id 
                || betDoc.data().secret == false
                //|| currentUser.id == 'Ke5I8MktMAOfwZ1FmFF5PcyrGPt2' 
                )){
                    var user1Name;
                    var user2Name;
                    // console.log(betDoc.id);
                    // console.log(betDoc.data().user1.id);
                    var user1 = userDocs.filter( function(userDocs){return (userDocs.id == betDoc.data().user1.id);} );
                    user1Name = user1[0].data().name;
                    var user2 = userDocs.filter( function(userDocs){return (userDocs.id == betDoc.data().user2.id);} );
                    user2Name = user2[0].data().name;
                    var li = `<li class="collection-item">`;
                    var text = `
                    <p>${user1Name} bets ${user2Name} ${betDoc.data().claim} for ${betDoc.data().amount} cheese ball(s)</p>`;
                    var resolveButton = `
                    <button onclick="resolveBet('${betDoc.id}')" class="btn yellow darken-2 z-depth-0 modal-trigger" betID="${betDoc.id}" data-target="modal-resolve">Resolve</button>`
                    var deleteButton = `
                    <button onclick="deleteBet('${betDoc.id}')" class="btn yellow darken-2 z-depth-0" betID="${betDoc.id}">Delete</button>`
                    var dateLabel = `
                    <p class=" darken-2 z-depth-0 right-align" betID="${betDoc.id}">Created On: ${activeDate.toLocaleDateString()}</p>`
                    li += text;
                    li += resolveButton;
                    li += deleteButton;
                    li += dateLabel;
                    html += li;
                }
            });
            var statHTML = ``;
            statHTML += `<h5 class="center-align">Open Bets: ${totalBets} (${totalBallsBet} cheese balls)</h5>`;
            betStats.innerHTML = statHTML;
            betList.innerHTML = html;
        });


        }else{
            betList.innerHTML = '<h5 class="center-align">Login to view pending bets</h5>';
            betStats.innerHTML = '';
        }

}


// setup materialize components
document.addEventListener('DOMContentLoaded', function() {

  var modals = document.querySelectorAll('.modal');
  M.Modal.init(modals);

  var items = document.querySelectorAll('.collapsible');
  M.Collapsible.init(items);

});



function resolvedBets(betDocs,userDocs){
    var html = ``;
    var resolvedCount = 0;
    if(betDocs.length){
        resolvedBetsList = betDocs.filter( function(betDocs){return (betDocs.data().resolved == true);} );
        resolvedBetsList.sort((a,b) => {
            if(a.data().inactiveDate > b.data().inactiveDate){
                return -1;
            }else{
                return 1;
            }
        })
        if(resolvedBetsList.length){
            resolvedBetsList.forEach(resolvedBet => {
                user1 = userDocs.filter( function(userDocs){return (userDocs.id == resolvedBet.data().user1.id);} );
                user2 = userDocs.filter( function(userDocs){return (userDocs.id == resolvedBet.data().user2.id);} );
                var winnerID;
                if(resolvedBet.data().user1Won == true){
                    winnerID = user1[0].id;
                }else{
                    winnerID = user2[0].id;
                }
                var betText = user1[0].data().name + ' bets ' + user2[0].data().name + ' ' + resolvedBet.data().claim + ' for ' + resolvedBet.data().amount + ' cheese ball(s)';
                var timestamp = resolvedBet.data().inactiveDate;
                var dateString = 'null';
                if(timestamp != null){
                var inactiveDate = new Date(timestamp.seconds * 1000);
                dateString = inactiveDate.toLocaleDateString();
                }
                var li = `
                <li class="collection-item">
                <p class="left-align">${betText}</p>
                <p onClick="congratulate('${winnerID}')" class="btn yellow darken-2 z-depth-0">${resolvedBet.data().winner}</p>
                <p class="right-align right">Resolved on: ${dateString}</p>
                </li>`;
                html += li;
                resolvedCount += resolvedBet.data().amount;
            });
            resolvedList.innerHTML = html;
            resolvedStats.innerHTML = `<h5 class="center-align">Balls Recently Resolved: ${resolvedCount}</h5>`;
        }
    }else{
        resolvedList.innerHTML = `<h5 class="center-align">Login to view resolved bets</h5>`;
    }
}


function congratulate(winnerID){
    var user = firebase.auth().currentUser;
    if(user.uid == winnerID){
        alert("Cant congratulate yourself")
        return;
    }
    db.collection('userz').doc(winnerID).get().then(winner => {
        alert('Congratulations, ' + winner.data().name + "!");
        db.collection('userz').doc(winnerID).update({
            congrats: 1 + winner.data().congrats
        })
    })
}