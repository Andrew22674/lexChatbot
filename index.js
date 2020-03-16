
'use strict';


function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
        },
    };
}

function confirmIntent(sessionAttributes, intentName, slots, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ConfirmIntent',
            intentName,
            slots,
            message,
        },
    };
}

function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}


function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}


function validEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}


function isValidInstrument(instrument) {
    const validInstruments = ['guitar', 'viola', 'violin', 'drums', 'piano'];
    return (validInstruments.indexOf(instrument.toLowerCase()) > -1);
}

function isValidExp(exp){
    const validExp = ['beginner', 'intermediate', 'advanced'];
    return (validExp.indexOf(exp.toLowerCase()) > -1);
}

function isValidAdOrCh(x){
    return (x === 'adult' || x === 'child');
}


function buildValidationResult(isValid, violatedSlot, messageContent) {
    return {
        isValid,
        violatedSlot,
        message: { contentType: 'PlainText', content: messageContent },
    };
}

function validateClass(slots) {
    const instrument = slots.instrument;
    const exp = slots.experience;
    const adultorchild = slots.adult_or_child;
    
    const classdate = slots.classdate;
    //const email = slots.email;
    

    if (instrument && !isValidInstrument(instrument)) {
        return buildValidationResult(false, 'instrument', `We are sorry but we do not have any lessons available for the ${instrument}. We are currently giving guitar, violin, viola, drum and piano lessons.`);
    }
    
    if(exp && !isValidExp(exp)){
         return buildValidationResult(false, 'experience', `Plese enter a valid option [beginner, intermediate, advanced]`);
    }
    
    if(adultorchild && !isValidAdOrCh(adultorchild)){
        return buildValidationResult(false, 'adult_or_child', `Please specify if the person receiving the class is an adult or a child`);
    }
    
   /*tratando de validar la fecha
   si la fecha ingresade es en el pasado, no deberia ser valida
   
   if (classdate) {
        if (new Date(classdate) <= (new Date())) {
            return buildValidationResult(false, 'classdate', 'Your check in date is in the past!  Can you try a different date?');
        }
    }*/
    
    
    /*if(email && !validEmail(email)){
        return buildValidationResult(false, 'email', 'Please enter a valid email');
    }*/

    return { isValid: true };
}


function bookClass(intentRequest, callback){
    const _instrument = intentRequest.currentIntent.slots.instrument;
    const adultorchild = intentRequest.currentIntent.slots.adult_or_child;
    const _email = intentRequest.currentIntent.slots.email;
    const thedate = intentRequest.currentIntent.slots.date;
    const sessionAttributes = intentRequest.sessionAttributes;
    
    const booking = String(JSON.stringify({ instrument: _instrument, adult_or_child : adultorchild, date: thedate, email : _email}));
    sessionAttributes.currentBooking = booking;
    
    
     if (intentRequest.invocationSource === 'DialogCodeHook') {

        const validationResult = validateClass(intentRequest.currentIntent.slots);
        if (!validationResult.isValid) {
            const slots = intentRequest.currentIntent.slots;
            slots[`${validationResult.violatedSlot}`] = null;
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
            slots, validationResult.violatedSlot, validationResult.message));
            return;
        }

        if(_instrument && adultorchild && _email && thedate){
            let price = 0;
            if(adultorchild === "adult"){
                price = 3000;
            }else{
                price = 2500;
            }
            sessionAttributes.lessonPrice = price;
        }else{
            delete sessionAttributes.lessonPrice;
        }
        sessionAttributes.currentReservation = booking;
        callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
        return;
    }
    /*
    delete sessionAttributes.lessonPrice;
    delete sessionAttributes.currentBooking;
    sessionAttributes.lastConfirmedReservation = booking;

    callback(close(sessionAttributes, 'Fulfilled',
    { contentType: 'PlainText', content: 'Thanks, you are now closer to playing the ' + _instrument + 'like a pro!' + ' Your price for the lesson is ' + sessionAttributes.lessonPrice}));
    
    */
}


 // Intents
function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);
    const intentName = intentRequest.currentIntent.name;

    if (intentName === 'bookClass') {
        return bookClass(intentRequest, callback);
    }
    
    throw new Error(`Intent with name ${intentName} not supported`);
}

// Main handler

exports.handler = (event, context, callback) => {
    
    try {
        console.log(`event.bot.name=${event.bot.name}`);
        
        if (event.bot.name != 'musicLessons') {
             callback('Invalid Bot Name');
        }
        
        dispatch(event, (response) => callback(null, response));
    } catch (err) {
        callback(err);
    }
};