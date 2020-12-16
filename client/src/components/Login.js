import React, { Component } from 'react';
import firebase from '../firebase';
import { Link, withRouter } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { toast } from 'react-toastify';

const EmailSchema = Yup.object().shape({
    email: Yup.string()
      .required("Inserisci un'email.")
      .email("Inserisci un'email valida.")
})

const LoginSchema = Yup.object().shape({
    password: Yup.string()
      .required("Inserisci una password.")
      .min(8, "La password deve contenere almeno 8 caratteri.")
      .max(16, "La password può contenere al massimo 16 caratteri.")
      .matches(/(?=.*[0-9])/, "La password deve contenere almeno un numero.")
})

class Login extends Component {

    resetPassword(e, email) {
        e.preventDefault();
        EmailSchema.isValid({ email: email }).then(res => {
            if(res === false) return toast.error("Inserisci un'email per recuperarla.");

            firebase.auth().languageCode = 'it';
            firebase.auth()
                .sendPasswordResetEmail(email)
                .then(() => toast.success("È stata inviata un email per recuperare la password."))
                .catch(error => {
                    switch(error.code) {
                        case 'auth/user-not-found': toast.error("Utente non trovato."); break;
                        case 'auth/invalid-email': toast.error("Indirizzo email invalido."); break;
                        default: toast.error("Servizio in manutenzione."); break;
                    }
                });
        })       
    }

    componentDidMount() {
        if(this.props.user !== null)return this.props.history.push("/");
    }

    render() {

        return (
            <div className="container">

                <Link to="/">
                    <img src="https://assets.subito.it/static/logos/lavoro.svg" alt="Logo" />
                </Link>

                <p>
                    Digita i dati inseriti alla registrazione per effettuare il <strong>login</strong>.
                </p>

                <Formik
                    initialValues={{ 
                        email: "", 
                        password: "" 
                    }}
                    validationSchema={EmailSchema.concat(LoginSchema)}
                    onSubmit={values => {
                        var that = this;
                        firebase.auth()
                            .signInWithEmailAndPassword(values.email, values.password)
                            .then(function() {
                                toast.success("Login effettuato!");
                                that.props.history.push('/');
                            })
                            .catch(error => {
                                switch(error.code) {
                                    case 'auth/user-not-found': toast.error("Utente non trovato."); break;
                                    case 'auth/invalid-email': toast.error("Indirizzo email invalido."); break;
                                    case 'auth/user-disabled': toast.error("Utente bannato."); break;
                                    case 'auth/wrong-password': toast.error("Password errata."); break;
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
                                <i className="fa fa-envelope fa-lg" />
                                <input 
                                    type="text" 
                                    name="email" 
                                    placeholder="Email" 
                                    value={values.email} 
                                    onChange={handleChange} 
                                    onBlur={handleBlur} 
                                />
                                {touched.email && errors.email && 
                                    <div className="input-error">
                                        {errors.email}
                                    </div>
                                }
                            </div>
                            <div className="input-group">
                                <i className="fa fa-key fa-lg" />
                                <input 
                                    type="password" 
                                    name="password" 
                                    placeholder="Password" 
                                    value={values.password} 
                                    onChange={handleChange} 
                                    onBlur={handleBlur} 
                                />
                                {touched.password && errors.password &&
                                    <div className="input-error">
                                        {errors.password}
                                    </div>
                                }
                            </div>  
                            <div className="input-group">
                                <div>
                                    Hai dimenticato la password? 
                                    <a 
                                        href="/#" 
                                        onClick={(e) => this.resetPassword(e, values.email)}
                                    >
                                        Clicca qui!
                                    </a>
                                </div>
                                <button 
                                    type="submit" 
                                    className="btn-container success" 
                                    disabled={!dirty}
                                >
                                    Entra
                                </button>
                            </div>
                        </form>
                    )}
                </Formik>
            </div>
        );
    }
}

export default withRouter(Login);