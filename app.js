var resolveBetID;
var resolveForm = document.querySelector("#resolve-form");
var globalUser;





//delete bet
function deleteBet(betID){
	if (confirm("Are you sure?")) {
		db.collection('bets').doc(betID).update({
			active: false,
			resolved: false
		});
	} 
}


//resolve bet

	//set id
function resolveBet(betID){
	resolveBetID = betID;
	var resolvePicker = document.querySelector('#winnerSelect');
	var html = `<option value="" disabled selected>Choose winner</option>`;
	
	db.collection('bets').doc(betID).get().then(betDoc => {
		db.collection('userz').doc(betDoc.data().user1.id).get().then(user1Doc => {
			db.collection('userz').doc(betDoc.data().user2.id).get().then(user2Doc => {
				html += `<option value="${user1Doc.data().email}">${user1Doc.data().name}</option>`;
				html += `<option value="${user2Doc.data().email}">${user2Doc.data().name}</option>`;
				resolvePicker.innerHTML = html;
				var instances = M.FormSelect.init(resolvePicker);
			});
		});
	});


}

	//resolveForm
resolveForm.addEventListener('submit',(e) => {
	e.preventDefault();
	var winnerEmail = resolveForm['winnerSelect'].value;
	db.collection('bets').doc(resolveBetID).get().then(betDoc => {
		db.collection('userz').doc(betDoc.data().user1.id).get().then(user1Doc => {
			db.collection('userz').doc(betDoc.data().user2.id).get().then(user2Doc => {

				if(winnerEmail != user1Doc.data().email && winnerEmail != user2Doc.data().email){
					alert("Please enter a valid email, its not that hard");
					const modal = document.querySelector('#modal-resolve');
					//M.Modal.getInstance(modal).close();
					resolveForm.reset();
					return;
				}else{
					//set winner
					if(winnerEmail == user1Doc.data().email){
						var winnerDoc = user1Doc;
						var loserDoc = user2Doc;
						var whoWon = true;
					}else{
						var winnerDoc = user2Doc;
						var loserDoc = user1Doc;
						var whoWon = false;
					}
					//find existing records
					db.collection('ballzOwed').where('owed','==',db.collection('userz').doc(winnerDoc.id)).where('owedBy','==',db.collection('userz').doc(loserDoc.id)).get().then(oweDoc1 => {
						if(oweDoc1.docs[0] == null){
							db.collection('ballzOwed').where('owed','==',db.collection('userz').doc(loserDoc.id)).where('owedBy','==',db.collection('userz').doc(winnerDoc.id)).get().then(oweDoc2 => {
								if(oweDoc2.docs[0] == null){
									//no docs exist

									//create owed record
									db.collection('ballzOwed').add({
										owed: db.doc('userz/'+ winnerDoc.id),
										owedBy: db.doc('userz/'+ loserDoc.id),
										amount:parseInt(betDoc.data().amount)
									});
									//update bet
									db.collection('bets').doc(betDoc.id).update({
										active: false,
										winner: winnerDoc.data().name,
										resolved: true,
										inactiveDate: firebase.firestore.FieldValue.serverTimestamp(),
										user1Won: whoWon,
										resolvedBy: db.doc('userz/'+ globalUser.uid)
									});
								}else{
									//doc where loser is owed exists
									//update record
									db.collection('ballzOwed').doc(oweDoc2.docs[0].id).set({
										owed: db.doc('userz/'+ loserDoc.id),
										owedBy: db.doc('userz/'+ winnerDoc.id),
										amount: parseInt(oweDoc2.docs[0].data().amount) - parseInt(betDoc.data().amount)
									});
									//update bet
									db.collection('bets').doc(betDoc.id).update({
										active: false,
										winner: winnerDoc.data().name,
										resolved: true,
										inactiveDate: firebase.firestore.FieldValue.serverTimestamp(),
										user1Won: whoWon,
										resolvedBy: db.doc('userz/'+ globalUser.uid)
									});
								}
							})
						}else{
							//doc where winner is owed exists

							//update record
							db.collection('ballzOwed').doc(oweDoc1.docs[0].id).set({
								owed: db.doc('userz/'+ winnerDoc.id),
								owedBy: db.doc('userz/'+ loserDoc.id),
								amount: parseInt(betDoc.data().amount) + parseInt(oweDoc1.docs[0].data().amount)
							});
							//update bet
							db.collection('bets').doc(betDoc.id).update({
								active: false,
								winner: winnerDoc.data().name,
								resolved: true,
								inactiveDate: firebase.firestore.FieldValue.serverTimestamp(),
								user1Won: whoWon,
								resolvedBy: db.doc('userz/'+ globalUser.uid)
							});
						}
						const modal = document.querySelector('#modal-resolve');
						M.Modal.getInstance(modal).close();
						resolveForm.reset();
					})
				}
			});
		});
	});
});




//listen for auth status changes
auth.onAuthStateChanged(user => {
    if(user){
		globalUser = user;
        setupUI(user);
        db.collection('userz').onSnapshot(userSnapshot =>{
			db.collection('ballzOwed').get().then(owedSnapshot => {
				currentUser = firebase.auth().currentUser;
				if(currentUser){
					setupUsers(userSnapshot.docs,owedSnapshot.docs);
				}
				setupUI(user);
			});
		});
		db.collection('ballzOwed').onSnapshot(owedSnapshot => {
			db.collection('userz').get().then(userSnapshot => {
				currentUser = firebase.auth().currentUser;
				if(currentUser){
				setupUsers(userSnapshot.docs,owedSnapshot.docs);
				}
			});
		});
		db.collection('bets').onSnapshot(betSnapshot => {
			db.collection('userz').get().then(userSnapshot => {
				currentUser = firebase.auth().currentUser;
				if(currentUser){
				setupBets(betSnapshot.docs,userSnapshot.docs,firebase.auth().currentUser);

				var d = new Date();
				d.setMonth(d.getMonth() - 1);

				db.collection('bets').where('resolved','==',true).where('inactiveDate','>=',d).orderBy('inactiveDate','desc').limit(10).get().then(filteredBets => {
					resolvedBets(filteredBets.docs,userSnapshot.docs);
				});
				}
			});
		});
		
    }else{
		globalUser = null;
		setupUI();
		setupUsers([]);
		setupBets([],[],null);
		resolvedBets([],[]);
    }
});





//create new bet
const createForm = document.querySelector('#create-form');
createForm.addEventListener('submit',(e) => {
	e.preventDefault();
	var user1ID = createForm['user1Select'].value;
	var user2ID = createForm['user2Select'].value;
	var claim = createForm['claim'].value;
	var amount = createForm['numberSelect'].value;
	var secret = createForm['secret'].checked;

	if(user1ID == '' || user2ID == '' || claim == '' || amount == '' || user1ID == user2ID){
		alert("Invalid data");
		return;
	}


    db.collection('bets').add({
		user1: db.doc('userz/'+ user1ID),
		user2: db.doc('userz/'+ user2ID),
		claim: claim,
		amount: parseInt(amount),
		active: true,
		secret: secret,
		activeDate: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        //close modal and reset form
        const modal = document.querySelector('#modal-create');
        M.Modal.getInstance(modal).close();
        createForm.reset();
    });
});


//record payment
const recordForm = document.querySelector('#record-form');
recordForm.addEventListener('submit',(e) => {
	e.preventDefault();
	var payerID = recordForm['user1Record'].value;
	var payeeID = recordForm['user2Record'].value;
	var amount = recordForm['numberPaid'].value;

	if(payerID == '' || payeeID == '' || amount == '' || payeeID == payerID){
		alert("invalid data");
		return;
	}

	//check for existing debt
	db.collection('ballzOwed').where('owed', '==', db.collection('userz').doc(payeeID)).where('owedBy', '==', db.collection('userz').doc(payerID)).get().then(debtDocs1 => {
		if(debtDocs1.docs[0] == null){
			db.collection('ballzOwed').where('owed', '==', db.collection('userz').doc(payerID)).where('owedBy', '==', db.collection('userz').doc(payeeID)).get().then(debtDocs2 => {
				if(debtDocs2.docs[0] == null){
					//no debts exists
					db.collection('ballzOwed').add({
						owed: db.doc('userz/'+ payerID),
						owedBy: db.doc('userz/'+ payeeID),
						amount: parseInt(amount)
					});
					const modal = document.querySelector('#modal-record');
					M.Modal.getInstance(modal).close();
					recordForm.reset();
				}else{
					//debt exitst where payer is owed balls
					db.collection('ballzOwed').doc(debtDocs2.docs[0].id).set({
						owed: db.doc('userz/'+ payerID),
						owedBy: db.doc('userz/'+ payeeID),
						amount: parseInt(debtDocs2.docs[0].data().amount) + parseInt(amount)
					}).then(() => {
						const modal = document.querySelector('#modal-record');
						M.Modal.getInstance(modal).close();
						recordForm.reset();		
					})
				}
			})
		}else{
			//debt where payer owes balls exists
			db.collection('ballzOwed').doc(debtDocs1.docs[0].id).set({
				owed: db.doc('userz/'+ payeeID),
				owedBy: db.doc('userz/'+ payerID),
				amount: parseInt(debtDocs1.docs[0].data().amount) - parseInt(amount)
			}).then(() => {
				const modal = document.querySelector('#modal-record');
				M.Modal.getInstance(modal).close();
				recordForm.reset();		
			})
		}
	})

});

//signup
const signupForm = document.querySelector('#signup-form');
signupForm.addEventListener('submit',(e) => {
    e.preventDefault();

    // get user info
    const email = signupForm['signup-email'].value;
    const password = signupForm['signup-password'].value;

    //sign up the user
    auth.createUserWithEmailAndPassword(email,password).then(cred => {
        return db.collection('userz').doc(cred.user.uid).set({
			email: signupForm['signup-email'].value,
			name: signupForm['signup-name'].value
        });
    }).then(() => {
        const modal = document.querySelector('#modal-signup');
        M.Modal.getInstance(modal).close();
        signupForm.reset();
        signupForm.querySelector('.error').innerHTML = '';
    }).catch(err => {
        signupForm.querySelector('.error').innerHTML = err.message;
    });   
});


//logout
const logout = document.querySelector('#logout');
logout.addEventListener('click',(e) => {
    e.preventDefault();
    auth.signOut();
});


//login
const loginForm = document.querySelector('#login-form');
loginForm.addEventListener('submit',(e) =>{
    e.preventDefault();

    //get user info
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;

    auth.signInWithEmailAndPassword(email,password).then(cred => {
        //close modal and reset form
        const modal = document.querySelector('#modal-login');
        M.Modal.getInstance(modal).close();
        loginForm.reset();
        loginForm.querySelector('.error').innerHTML = '';

    }).catch(err => {
        loginForm.querySelector('.error').innerHTML = err.message;
    });
});