const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const admin = require('firebase-admin');
admin.initializeApp();

exports.createCard = functions.https.onRequest((req, res) => {
    const roomId = req.query.roomId;
    const playerId = req.query.playerId;
    const playerName = req.query.playerName;

    admin.firestore().collection('rooms').doc(roomId).get().then(async doc => {
        if (doc.data().status > 0) {
            res.json({
                error: 'Already playing game.',
            });
            return;
        }

        if (playerId && playerId !=='undefined') {
            admin.firestore().collection('cards').where('playerId', '==', playerId)
                .where('roomId', '==', roomId).get().then(async querySnapshot => {
                
                const card = querySnapshot.docs.find(card => card.data().playerId == playerId);
                if (card) {
                    res.json({
                        cardId: card.id,
                        playerId: playerId,
                        numbers: card.data().numbers,
                    });
                } else {
                    await resultNewCard(res, roomId, playerName);
                }
            });
        } else {
            await resultNewCard(res, roomId, playerName);
        }
    });
});

async function resultNewCard(res, roomId, playerName) {
    const numbers = makeNumbers();
    const playerId = makePlayerId();

    const writeResult = await admin.firestore().collection('cards').add({
        roomId: roomId,
        playerId: playerId,
        playerName: playerName,
        numbers: JSON.stringify(numbers),
        bingo: 0,
        reach: 0,
    });
    res.json({
        cardId: writeResult.id,
        playerId: playerId,
        numbers: numbers,
    });
}

function makeNumbers() {
    let numbers =  [
        [],
        [],
        [],
        [],
        [],
    ];
    const existNumber = (numbers, number) => {
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                if (numbers[i][j] == number) {
                    return true;
                }
            }
        }
        return false;
    }
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            if (i == 2 && j == 2) {
                numbers[i][j] = '*';
                continue;
            }
            starts = [1, 16, 31, 46, 61];
            let rand = Math.floor(Math.random() * Math.floor(15)) + starts[j];
            while (existNumber(numbers, rand)) {
                rand = Math.floor(Math.random() * Math.floor(15)) + starts[j];
            }
            numbers[i][j] = rand;
        }
    }
    return numbers;
}

function makePlayerId() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let playerId = '';
    for (let i = 0; i < 32; i++) {
        rand = Math.floor(Math.random() * Math.floor(62));
        playerId += chars[rand];
    }
    return playerId;
}
