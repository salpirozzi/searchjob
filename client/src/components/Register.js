/* https://stackoverflow.com/questions/49372164/check-a-document-field-for-a-specific-value-in-cloud-firestore */

import React, { Component } from 'react';
import firebase from '../firebase';
import { withRouter, Link } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { toast } from 'react-toastify';

const RegisterSchema = Yup.object().shape({
    username: Yup.string()
      .required("Inserisci un username.")
      .min(3, "L'username deve contenere almeno 3 caratteri.")
      .max(15, "L'username può contenere al massimo 15 caratteri.")
      .matches(/^[a-zA-Z. ]+$/, "L'username deve contenere solo lettere."),
    email: Yup.string()
      .email("Inserisci un'email valida.")
      .required("Inserisci un'email."),
    password: Yup.string()
      .required("Inserisci una password.")
      .min(8, "La password deve contenere almeno 8 caratteri.")
      .max(16, "La password può contenere al massimo 16 caratteri.")
      .matches(/(?=.*[0-9])/, "La password deve contenere almeno un numero."),
    cpassword: Yup.string()
        .required("Conferma la nuova password.")
        .oneOf([Yup.ref('password'), null], 'Inserisci la password inserita sopra.'),
    sex: Yup.string()
        .required("Scegli il tuo sesso."),
    date: Yup.date() 
        .required("Inserisci una data di nascita.")
        .max(new Date(2020, 12, 31), "Non puoi inserire una anno maggiore del 2020.")
        .min(new Date(1920, 1, 1), "Non puoi inserire una anno minore del 1920.")
})

class Register extends Component {

    componentDidMount() {
        if(this.props.user !== null) this.props.history.push("/");
    }

    render() {

        return (
            <div className="App">
                <div className="container">
                    <Link to="/"><img src="https://assets.subito.it/static/logos/lavoro.svg" alt="Logo" /></Link>
                    <p>Benvenuto sul nostro sito per cercare il <strong>lavoro</strong> che hai sempre <strong>desiderato</strong>.</p>
                    <p>Registrati per candidarti alle <strong>offerte di lavoro</strong> che più ti aggradano o, in alternativa, per pubblicarne una tu!</p>
                    <Formik
                        initialValues={{ email: "", password: "", cpassword: "", date: "", sex: "", username: "" }}
                        validationSchema={RegisterSchema}
                        onSubmit={values => {
                            firebase.auth().createUserWithEmailAndPassword(values.email, values.cpassword)
                                .then(res => {
                                    var db = firebase.firestore();
                                    const birthday = new Date(values.date);
                                    const data = {
                                        username: values.username,
                                        sex: values.sex,
                                        birthday: firebase.firestore.Timestamp.fromDate(birthday)
                                    }
                                    db.collection('users').doc(res.user.uid).set(data);
                                    toast.success("Registrazione effettuata con successo!");
                                })
                                .catch(error => {
                                    switch(error.code) {
                                        case 'auth/email-already-in-use': toast.error("Email già registrata."); break;
                                        case 'auth/invalid-email': toast.error("Indirizzo email invalido."); break;
                                        case 'auth/operation-not-allowed': toast.error("Servizio attualmente in manutenzione."); break;
                                        case 'auth/weak-password': toast.error("Password troppo debole."); break;
                                        default: break;
                                    }
                                });
                        }}
                        >
                        {({
                            values,
                            touched,
                            errors,
                            handleChange,
                            handleBlur,
                            handleSubmit,
                            dirty
                        }) => (
                            <form onSubmit={handleSubmit}>
                                <div className="input-group">
                                    <i className="fa fa-user fa-lg"></i>
                                    <input type="text" name="username" placeholder="Nome utente/azienda" value={values.username} onChange={handleChange} onBlur={handleBlur} />
                                    {touched.username && errors.username && <div className="input-error">{errors.username}</div>}
                                </div>
                                <div className="input-group">
                                    <i className="fa fa-envelope fa-lg"></i>
                                    <input type="text" name="email" placeholder="Email" value={values.email} onChange={handleChange} onBlur={handleBlur} />
                                    {touched.email && errors.email && <div className="input-error">{errors.email}</div>}
                                </div>
                                <div className="input-group">
                                    <i className="fa fa-key fa-lg"></i>
                                    <input type="password" name="password" placeholder="Password" value={values.password} onChange={handleChange} onBlur={handleBlur} />
                                    {touched.password && errors.password && <div className="input-error">{errors.password}</div>}
                                </div>  
                                <div className="input-group">
                                    <i className="fa fa-lock fa-lg"></i>
                                    <input type="password" name="cpassword" placeholder="Conferma Password" value={values.cpassword} onChange={handleChange} onBlur={handleBlur} />
                                    {touched.cpassword && errors.cpassword && <div className="input-error">{errors.cpassword}</div>}
                                </div>  
                                <div className="input-group-inline">
                                    <p>Sesso</p>

                                    <input type="radio" name="sex" value="0" onChange={handleChange} onBlur={handleBlur} />
                                    <label htmlFor="unspecified">Non specificato</label>

                                    <input type="radio" name="sex" value="1" onChange={handleChange} onBlur={handleBlur} />
                                    <label htmlFor="male">Maschio</label>

                                    <input type="radio" name="sex" value="2" onChange={handleChange} onBlur={handleBlur} />
                                    <label htmlFor="female">Femmina</label>

                                    {touched.sex && errors.sex && <div className="input-error">{errors.sex}</div>}
                                </div>
                                <div className="input-group-inline">
                                    <p>Data di nascita</p>
                                    <input type="date" name="date" min="1920-01-01" max="2020-12-31" value={values.date} onChange={handleChange} onBlur={handleBlur} />
                                    {touched.date && errors.date && <div className="input-error">{errors.date}</div>}
                                </div>
                                <div className="input-group">
                                    <button type="submit" className="btn-container insert" disabled={!dirty}>Registrati</button>
                                </div>
                            </form>
                        )}
                    </Formik>
                </div>
            </div>
        );
    }
}

export default withRouter(Register);