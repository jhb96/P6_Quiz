const Sequelize = require("sequelize");
const {models} = require("../models");

// Autoload the quiz with id equals to :quizId
exports.load = (req, res, next, quizId) => {

    models.quiz.findById(quizId)
    .then(quiz => {
        if (quiz) {
            req.quiz = quiz;
            next();
        } else {
            throw new Error('There is no quiz with id=' + quizId);
        }
    })
    .catch(error => next(error));
};


// GET /quizzes
exports.index = (req, res, next) => {

    models.quiz.findAll()
    .then(quizzes => {
        res.render('quizzes/index.ejs', {quizzes});
    })
    .catch(error => next(error));
};


// GET /quizzes/:quizId
exports.show = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/show', {quiz});
};


// GET /quizzes/new
exports.new = (req, res, next) => {

    const quiz = {
        question: "", 
        answer: ""
    };

    res.render('quizzes/new', {quiz});
};

// POST /quizzes/create
exports.create = (req, res, next) => {

    const {question, answer} = req.body;

    const quiz = models.quiz.build({
        question,
        answer
    });

    // Saves only the fields question and answer into the DDBB
    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz created successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/new', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error creating a new Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/edit
exports.edit = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/edit', {quiz});
};


// PUT /quizzes/:quizId
exports.update = (req, res, next) => {

    const {quiz, body} = req;

    quiz.question = body.question;
    quiz.answer = body.answer;

    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz edited successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/edit', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error editing the Quiz: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId
exports.destroy = (req, res, next) => {

    req.quiz.destroy()
    .then(() => {
        req.flash('success', 'Quiz deleted successfully.');
        res.redirect('/quizzes');
    })
    .catch(error => {
        req.flash('error', 'Error deleting the Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/play
exports.play = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || '';

    res.render('quizzes/play', {
        quiz,
        answer
    });
};


// GET /quizzes/:quizId/check
exports.check = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz,
        result,
        answer
    });
};
/*Metodo randomplay
/Genera pregunta al azar y cuenta el número de aciertos
/consecutivos.
/Esta función se llama cuando se clickea en Play
*/

exports.randomplay = (req, res, next) => {
    let score = 0;
     
     //Si req.session.randomplay es indefinido 
     if(req.session.randomplay === undefined){
        req.session.randomplay = req.session.randomplay || [];
     };

     models.quiz.findAll({where: {id:{[Sequelize.Op.notIn]: req.session.randomplay}}})
     .then(quizzes =>{ 

        //Entre todos los quizzes elegimos uno aleatorio
        let quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
        //El score será la longitud de req.session.randomplay, ya que contiene
        //las preguntas respondidas correctamente
        let score = req.session.randomplay.length || 0;
        
        //Si no hay preguntas  req.session.randomplay lo vaciamos y
        // devolvemos el score como res.
        if(quizzes.length === 0){ 
            req.session.randomplay = [];
            res.render('quizzes/random_nomore',{score});
            return;
        }    
        //Devolvemos el score y la pregunta como res
        res.render('quizzes/random_play', {score,quiz});
    })


     .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');        
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/random_play', {score, quiz});
    })
    .catch(error => {
        req.flash('error', 'Error playing the Quiz: ' + error.message);
        next(error);
   });
};

exports.randomCheck = (req, res, next) =>{

    if(req.session.randomplay === undefined){
        req.session.randomplay = req.session.randomplay || [];
     };

    const {quiz, query} = req;

    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();
    let score;
    //Si acierta la pregunta, el score se actualiza al valor de la long del array de 
    //acertadas
    //Se añade a este el valor de la quiz acertada
    if(result) {
        req.session.randomplay.push(quiz.id);
        score = req.session.randomplay.length;
    //sino, el score se queda en el actual y la el array de acertadas
    //se pone a cero
    }else{
        score = req.session.randomplay.length;
        req.session.randomplay = [];
    }

    //Finalmente, se devuelve en res el score, la respuesta
    //y el resultado y quizzes/random_result lo resuelve
    res.render('quizzes/random_result',{
        answer,
        result,
        score
    });
};