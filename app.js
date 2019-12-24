
const userList = document.querySelector('#user-list');
const betList = document.querySelector('#bet-list');
const body = document.querySelector('#body');

refreshAll();


function refreshAll(){

  while (userList.firstChild) {
    userList.removeChild(userList.firstChild);
  }
    while (betList.firstChild) {
    betList.removeChild(betList.firstChild);
  }

	let balanceLabel = document.createElement('h1');
	balanceLabel.textContent = "Current Balances";
	userList.appendChild(balanceLabel);
	let betLabel = document.createElement('h1');
	betLabel.textContent = "Pending Bets";
	betList.appendChild(betLabel);

	db.collection('users').get().then((snapshot) => {
		snapshot.docs.forEach(userDoc => {
			addUser(userDoc);
		});
	});

	db.collection('bets').get().then((snapshot) => {
		snapshot.docs.forEach(betDoc =>{
			addBet(betDoc);
		})
	});
		
	let addBetButton = document.createElement('button');
	addBetButton.textContent = "Add Bet";
	body.appendChild(addBetButton);

	addBetButton.addEventListener('click',(e) => {
	e.stopPropagation();
	alert("This isnt setup yet dumbass");

});

	//add action buttons
}





function addBet(betDoc){
	var better;
	var betee;
	var bet = betDoc.data().claim;

	let betText = document.createElement('p');
	let resolveButton = document.createElement('button');
	let deleteButton = document.createElement('button');


	resolveButton.setAttribute('bet-id',betDoc.id);
	resolveButton.textContent = "Resolve Bet";
	deleteButton.setAttribute('bet-id',betDoc.id);
	deleteButton.textContent = "Delete Bet";



	db.collection('users').doc(betDoc.data().user1.id).get().then((snapshot) => {
		better = snapshot.data().name;
		betText.textContent = better + " bets " + betee + " that " + bet;
	});


	db.collection('users').doc(betDoc.data().user2.id).get().then((snapshot) => {
		betee = snapshot.data().name;
		betText.textContent = better + " bets " + betee + " that " + bet;
	});

	betList.appendChild(betText);
	betList.appendChild(resolveButton);
	betList.appendChild(deleteButton);

	deleteButton.addEventListener('click',(e) => {
		e.stopPropagation();
		let id = e.target.getAttribute('bet-id');
		if (confirm("Are you sure?")) {
			db.collection('bets').doc(id).delete();
			refreshAll();
		} 	
	});

	resolveButton.addEventListener('click',(e) => {
		e.stopPropagation();
		let id = e.target.getAttribute('bet-id');
		var winnerUsername = prompt("Enter the username of the winner","rahulshahaha");
		var user1Username ;
		var user2Username;

		db.collection('bets').doc(id).get().then((resolveBetDoc) =>{
			db.collection('users').doc(resolveBetDoc.data().user1.id).get().then((user1Doc) =>{
				user1Username = user1Doc.data().username;
				db.collection('users').doc(resolveBetDoc.data().user2.id).get().then((user2Doc) =>{
					user2Username = user2Doc.data().username;
					validateBet(user1Username,user2Username,winnerUsername,id);
				});
			});
		});

	});

}

function validateBet(user1UserName,user2UserName,enteredUserName,betID){


	if(enteredUserName != user1UserName && enteredUserName != user2UserName){
		console.log("Wrong user");
		return;
	}



	db.collection('users').where('username','==',user1UserName).limit(1).get().then((user1Doc) => {
		db.collection('users').where('username','==',user2UserName).get().then((user2Doc) =>{
			db.collection('bets').doc(betID).get().then((betDoc) =>{
				if(enteredUserName == user1UserName){
					const owedUser = firebase.firestore().collection('users').doc(user1Doc.docs[0].id);
					const oweUser = firebase.firestore().collection('users').doc(user2Doc.docs[0].id);
					db.collection('ballzOwed').where('owed','==',owedUser).where('owedBy','==',oweUser).get().then((snapshot) =>{
						if(snapshot.docs[0] == null){
							db.collection('ballzOwed').add({
								owed: db.doc('users/'+ user1Doc.docs[0].id),
								owedBy: db.doc('users/'+ user2Doc.docs[0].id),
								amount: betDoc.data().amount
							});
							//db.collection('bets').doc(betID).delete();
							refreshAll();
						}else{
							db.collection("ballzOwed").doc(snapshot.docs[0].id).set({
								amount: snapshot.docs[0].data().amount + betDoc.data().amount,
								owed: snapshot.docs[0].data().owed,
								owedBy: snapshot.docs[0].data().owedBy
							})
							//db.collection('bets').doc(betID).delete();
							refreshAll();
						}
					});
				}
			});
		});
	});





}


function addUser(doc){

	let personHolder = document.createElement('div');
	let name = document.createElement('p');
	let owedList = document.createElement('ul');
	let oweList = document.createElement('ul');



	name.setAttribute('data-id',doc.id);
	name.setAttribute('name',doc.data().name);
	name.setAttribute('username',doc.data().username);
	owedList.setAttribute('id','owed');
	owedList.setAttribute('data-id',doc.id);
	oweList.setAttribute('id','owe');
	oweList.setAttribute('data-id',doc.id);
	personHolder.setAttribute('data-id',doc.id);
	personHolder.setAttribute('name',doc.data().name);
	personHolder.setAttribute('username',doc.data().username);


	var balance = 0;



	const owedUser = firebase.firestore().collection('users').doc(doc.id);
   

	db.collection('ballzOwed').where('owed','==',owedUser).get().then((snapshot) => {
		snapshot.docs.forEach(owedDoc => {
				db.collection('users').doc(owedDoc.data().owedBy.id).get().then(function(owerDoc){
						var number = owedDoc.data().amount;
						var person = owerDoc.data().name;
						var OwedText = person + " owes " + doc.data().name + " " + number + " cheese balls";
						var owedLabel = document.createElement('p');
						owedLabel.textContent = OwedText;
						owedList.appendChild(owedLabel);
						balance = parseInt(balance) + parseInt(number);
						name.textContent = doc.data().name + " (" + doc.data().username + "): " + parseInt(balance);
				});
		});
	})

	db.collection('ballzOwed').where('owedBy','==',owedUser).get().then((snapshot) => {
		snapshot.docs.forEach(owedDoc => {
				db.collection('users').doc(owedDoc.data().owed.id).get().then(function(owerDoc){
						var number = owedDoc.data().amount;
						var person = owerDoc.data().name;
						var OwedText = doc.data().name + " owes " + person + " " + number + " cheese balls";
						var owedLabel = document.createElement('p');
						owedLabel.textContent = OwedText;
						owedList.appendChild(owedLabel);
						balance = parseInt(balance) - parseInt(number);
						name.textContent = doc.data().name + " (" + doc.data().username + "): " + parseInt(balance);
				});
		});
	})

	name.textContent = doc.data().name + " (" + doc.data().username + "): " + parseInt(balance);

	personHolder.appendChild(name);
	personHolder.appendChild(owedList);
	personHolder.appendChild(oweList);
	userList.appendChild(personHolder);


}



