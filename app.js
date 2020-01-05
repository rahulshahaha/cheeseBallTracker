var resolveBetID;
var resolveForm = document.querySelector("#resolve-form");





//delete bet
function deleteBet(betID){
	if (confirm("Are you sure?")) {
		db.collection('bets').doc(betID).update({
			active: false
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
					if(winnerEmail == user1Doc.data().email){
						//user 1 wins
						//see if there is existing debt
						db.collection('ballzOwed').where('owed','==',db.collection('userz').doc(betDoc.data().user1.id)).where('owedBy','==',db.collection('userz').doc(betDoc.data().user2.id)).get().then(oweDoc =>{
							if(oweDoc.docs[0] == null){
								//debt does not exist
								db.collection('ballzOwed').add({
									owed: db.doc('userz/'+ user1Doc.id),
									owedBy: db.doc('userz/'+ user2Doc.id),
									amount:parseInt(betDoc.data().amount)
								});
								db.collection('bets').doc(betDoc.id).update({
									active: false
								});
							}else{	
								//debt exists
								db.collection('ballzOwed').doc(oweDoc.docs[0].id).set({
									owed: db.doc('userz/'+ user1Doc.id),
									owedBy: db.doc('userz/'+ user2Doc.id),
									amount: parseInt(betDoc.data().amount) + parseInt(oweDoc.docs[0].data().amount)
								});
								db.collection('bets').doc(betDoc.id).update({
									active: false
								});
							}
						});
					}else{
						//user 2 wins
						//see if there is existing debt
						db.collection('ballzOwed').where('owed','==',db.collection('userz').doc(betDoc.data().user2.id)).where('owedBy','==',db.collection('userz').doc(betDoc.data().user1.id)).get().then(oweDoc =>{
							if(oweDoc.docs[0] == null){
								//debt does not exist
								db.collection('ballzOwed').add({
									owed: db.doc('userz/'+ user2Doc.id),
									owedBy: db.doc('userz/'+ user1Doc.id),
									amount: parseInt(betDoc.data().amount)
								});
								db.collection('bets').doc(betDoc.id).update({
									active: false
								});
							}else{	
								//debt exists
								db.collection('ballzOwed').doc(oweDoc.docs[0].id).set({
									owed: db.doc('userz/'+ user2Doc.id),
									owedBy: db.doc('userz/'+ user1Doc.id),
									amount: parseInt(betDoc.data().amount) + parseInt(oweDoc.docs[0].data().amount)
								});
								db.collection('bets').doc(betDoc.id).update({
									active: false
								});
							}
						});
					}
					const modal = document.querySelector('#modal-resolve');
					M.Modal.getInstance(modal).close();
					resolveForm.reset();
				}
			});
		});
	});
});




//listen for auth status changes
auth.onAuthStateChanged(user => {
    if(user){
        setupUI(user);
        db.collection('userz').onSnapshot(userSnapshot =>{
			db.collection('ballzOwed').get().then(owedSnapshot => {
				currentUser = firebase.auth().currentUser;
				if(currentUser){
					setupUsers(userSnapshot.docs,owedSnapshot.docs);
				}
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
				}
			});
		});
		
    }else{
		setupUI();
		setupUsers([]);
		setupBets([]);
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
		secret: false
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
	db.collection('ballzOwed').where('owed', '==', db.collection('userz').doc(payeeID)).where('owedBy', '==', db.collection('userz').doc(payerID)).get().then(debtDocs => {
		if(debtDocs.docs[0] == null){
			//doesnt exist
			db.collection('ballzOwed').add({
				owed: db.doc('userz/'+ payeeID),
				owedBy: db.doc('userz/'+ payerID),
				amount: parseInt(amount)*-1
			});
			const modal = document.querySelector('#modal-record');
			M.Modal.getInstance(modal).close();
			recordForm.reset();
		}else{
			//exists
			if(debtDocs.docs[0].data().amount - amount == 0){
				db.collection("ballzOwed").doc(debtDocs.docs[0].id).delete().then(() => {
					const modal = document.querySelector('#modal-record');
					M.Modal.getInstance(modal).close();
					recordForm.reset();		
				});
			}else{
				db.collection('ballzOwed').doc(debtDocs.docs[0].id).set({
					owed: db.doc('userz/'+ payeeID),
					owedBy: db.doc('userz/'+ payerID),
					amount: parseInt(debtDocs.docs[0].data().amount) - parseInt(amount)
				}).then(() => {
					const modal = document.querySelector('#modal-record');
					M.Modal.getInstance(modal).close();
					recordForm.reset();		
				})
			}
		}
	});

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