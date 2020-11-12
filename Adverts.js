var express = require("express");
var router = express.Router();

router.post("/candidate", function(req, res) {
    const nodemailer = require("nodemailer");

    async function send() {

        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "fisimal.pro@gmail.com", 
                pass: "8709fisimal2182", 
            },
        });

        await transporter.sendMail({
            from: transporter.options.auth.user,
            to: "frex.samp@gmail.com", 
            subject: "✔ Nuova Candidatura " + req.body.advert.title, 
            text: req.body.introduction, 
            html: "Ciao <strong>" + req.body.advert.enterprise + "!</strong> C'è una nuova candidatura per la posizione <strong>" + req.body.advert.title + "</strong>. <br /><br /> \
                    Il candidato è <strong>" + req.body.user_details.username + "</strong> (" + req.body.user.email + "). Di seguito c'è la <strong>presentazione</strong> da lui inviata: <br /><br />" + req.body.introduction,
            attachments: [
            {   
                filename: 'Curriculum vitae.pdf',
                path: req.body.curriculum
            }]
        });

        await transporter.sendMail({
            from: transporter.options.auth.user,
            to: req.body.user.email, 
            subject: "✔ Nuova Iscrizione Annuncio", 
            text: req.body.introduction, 
            html: "Ciao <strong>" + req.body.user_details.username + "!</strong> Abbiamo ricevuto la tua candidatura per la posizione <strong>" + req.body.advert.title + "</strong>. <br /> \
                    Se la tua candidatura risulterà d'interesse, sarai contattato da <strong>" + req.body.advert.enterprise + "</strong>. <br /><br />\
                    <a href=http://localhost:3000/advert/" + req.body.advert.id + ">Clicca qui per visualizzare l'alluncio.</a>"
        });
    }

    send().catch(console.error);
})

module.exports = router;