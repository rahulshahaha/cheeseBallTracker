
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

	let lineBreak = document.createElement('hr');
	let user1Input = document.createElement('input');
	let user2Input = document.createElement('input');
	let claimInput = document.createElement('input');
	let amountInput = document.createElement('input');
	let thatText = document.createElement('p');
	let forText = document.createElement('p');
	let cheeseBallText = document.createElement('p');
	let bets = document.createElement('p');
	let submitBet = document.createElement('button');

	bets.textContent = 'bets';
	thatText.textContent = 'that';
	forText.textContent = 'for';
	cheeseBallText.textContent = 'cheese balls';
	submitBet.textContent = 'Submit Bet';

	user1Input.setAttribute('id','user1Input');
	user2Input.setAttribute('id','user2Input');
	claimInput.setAttribute('id','claimInput');
	amountInput.setAttribute('id','amountInput');

	amountInput.setAttribute('type','number');
	amountInput.setAttribute('min','1');
	amountInput.setAttribute('max','10');

	user1Input.setAttribute('placeholder','Username1');
	user2Input.setAttribute('placeholder','Username2');
	claimInput.setAttribute('placeholder','Claim');
	amountInput.setAttribute('placeholder','Amount');


	body.appendChild(lineBreak);
	body.appendChild(user1Input);
	body.appendChild(bets);
	body.appendChild(user2Input);
	body.appendChild(thatText);
	body.appendChild(claimInput);
	body.appendChild(forText);
	body.appendChild(amountInput);
	body.appendChild(cheeseBallText);
	body.appendChild(submitBet);


	lineBreak.style.display = "none";
	user1Input.style.display = "none";
	bets.style.display = "none";
	user2Input.style.display = "none";
	thatText.style.display = "none";
	claimInput.style.display = "none";
	forText.style.display = "none";
	amountInput.style.display = "none";
	cheeseBallText.style.display = "none";
	submitBet.style.display = "none";



	addBetButton.addEventListener('click',(e) => {
	e.stopPropagation();
	if(e.target.textContent == 'Add Bet'){
	lineBreak.style.display = "block";
	user1Input.style.display = "block";
	bets.style.display = "block";
	user2Input.style.display = "block";
	thatText.style.display = "block";
	claimInput.style.display = "block";
	forText.style.display = "block";
	amountInput.style.display = "block";
	cheeseBallText.style.display = "block";
	submitBet.style.display = "block";
	e.target.textContent = 'Cancel';
}else{
	lineBreak.style.display = "none";
	user1Input.style.display = "none";
	bets.style.display = "none";
	user2Input.style.display = "none";
	thatText.style.display = "none";
	claimInput.style.display = "none";
	forText.style.display = "none";
	amountInput.style.display = "none";
	cheeseBallText.style.display = "none";
	submitBet.style.display = "none";
	e.target.textContent = 'Add Bet';
}

});

	submitBet.addEventListener('click',(e)=>{
		e.stopPropagation();
		alert("relax");
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

console.log("here");

	db.collection('users').where('username','==',user1UserName).get().then((user1Doc) => {
		console.log(user1Doc);
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



