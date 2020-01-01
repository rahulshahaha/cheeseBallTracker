const userList = document.querySelector('.guides');
const betList = document.querySelector('#bet-list');
const loggedOutLinks = document.querySelectorAll('.logged-out');
const loggedInLinks = document.querySelectorAll('.logged-in');
const accountDetails = document.querySelector('.account-details');
const adminItems = document.querySelectorAll('.admin');

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
        <div class="pink-text">${user.admin ? 'Admin' : ''}</div>
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


    let html = '';
    let optionshtml = `<option value="" disabled selected>User</option>`;
    userDocs.forEach(doc => {

        var balance = 0;
        var textList = [];
        const userData = doc.data();
        const userID = doc.id;

        optionshtml += `<option value="${userID}">${userData.name}</option>`

        var owedToRecords = owedDocs.filter( function(owedDocs){return (owedDocs.data().owed.id == userID);} );

        owedToRecords.forEach(owedToRecord =>{
            var owedByArray = userDocs.filter(function(userDocs){return (userDocs.id == owedToRecord.data().owedBy.id);});
            var owedBy = owedByArray[0].data().name;
            var owedTo = doc.data().name;
            var amount = owedToRecord.data().amount;
            var text = owedBy + " owes " + owedTo + " " + amount + " cheese balls";
            //li += `<div class="collapsible-body white">${text}</div>`
            textList.push(`<div class="collapsible-body white">${text}</div>`);
            balance += amount;
        })

        var owedRecords = owedDocs.filter( function(owedDocs){return (owedDocs.data().owedBy.id == userID);} );

        owedRecords.forEach(owedRecord =>{
            var owedArray = userDocs.filter(function(userDocs){return (userDocs.id == owedRecord.data().owed.id);});
            var owedTo = owedArray[0].data().name;
            var owedBy = doc.data().name;
            var amount = owedRecord.data().amount;
            var text = owedBy + " owes " + owedTo + " " + amount + " cheese balls";
            // li += `<div class="collapsible-body white">${text}</div>`
            textList.push(`<div class="collapsible-body white">${text}</div>`);
            balance -= amount;
        })

        if(textList.length == 0){
            //li += `<div class="collapsible-body white">No balls owed or owed to</div>`
            textList.push(`<div class="collapsible-body white">No balls owed or owed to</div>`);   
        }

        var li = `
        <li>
            <div class="collapsible-header grey lighten-4">${userData.name} (${userData.email}): ${balance}</div>
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
}

}


//setup bets
const setupBets = (betDocs,userDocs) => {
    if(betDocs.length){
        let html = '';

        betDocs.forEach(betDoc => {
            if(betDoc.data().active){
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
                <p>${user1Name} bets ${user2Name} that ${betDoc.data().claim} for ${betDoc.data().amount} cheese ball(s)</p>`;
                var resolveButton = `
                <button onclick="resolveBet('${betDoc.id}')" class="btn yellow darken-2 z-depth-0 modal-trigger" betID="${betDoc.id}" data-target="modal-resolve">Resolve</button>`
                var deleteButton = `
                <button onclick="deleteBet('${betDoc.id}')" class="btn yellow darken-2 z-depth-0" betID="${betDoc.id}">Delete</button>`
                li += text;
                li += resolveButton;
                li += deleteButton;
                html += li;
            }
        });
        betList.innerHTML = html;
    }else{
        betList.innerHTML = '<h5 class="center-align">Login to view pending bets</h5>';
    }

}


// setup materialize components
document.addEventListener('DOMContentLoaded', function() {

  var modals = document.querySelectorAll('.modal');
  M.Modal.init(modals);

  var items = document.querySelectorAll('.collapsible');
  M.Collapsible.init(items);

});
