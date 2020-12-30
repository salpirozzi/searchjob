import React, { Component } from 'react';
import { withRouter } from "react-router-dom";
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

import firebase from '../firebase';
import Insert from './Insert';

import { toast } from 'react-toastify';

const FILE_SIZE = '200000'; //200 KB - unità di misura: BYTE
const SUPPORTED_FORMATS = ['application/doc', 'application/docx', 'application/pdf'];

const CandidateSchema = Yup.object().shape({
    introduction: Yup.string()
        .matches(/^[A-Za-z\u00C0-\u00FF0-9_-\s\d[',./():@]*$/, "La presentazione non può contenere caratteri speciali."),
    curriculum: Yup.mixed() 
        .required("Inserisci un curriculum vitae.")
        .test('fileSize', "File troppo grande. (max 200 kb)", value => value.size <= FILE_SIZE) 
        .test('fileType', "Estensione non supportata. (.pdf .doc .docx)", value => SUPPORTED_FORMATS.includes(value.type))
})

class Item extends Component {

    constructor() {
        super();
        this.state = { 
            msgbox: false,
            subscribed: false,
            editing: false,
            advert: null
        };
        this.showMsgBox = this.showMsgBox.bind(this);    
        this.editMode = this.editMode.bind(this); 
    }

    componentDidMount() {
        if(this.props.user !== null) {

            const db = firebase.firestore();
            const index = this.state.advert.id;
        
            let query = db.collection('nominations');
            query = query.where("advert_id", "==", index);
            query = query.where("candidate_id", "==", this.props.user.uid);

            query.get().then(res => {
                let subscribed = (res.docs.length < 1) ? false : true;
                this.setState({ 
                    subscribed: subscribed 
                });
            });
        }
    }

    static getDerivedStateFromProps(props, state) {

        if(props.advert_info !== state.advert) {
     
            return {
                advert: props.advert_info,
                editing: false,
                subscribed: false,
                msgbox: false
            };
        }
        return null;
    }

    editMode() {
        this.setState({ 
            editing: !this.state.editing
        });
    }

    showMsgBox() {
        if(this.state.subscribed === true) return 0;
        if(this.props.user === null)return this.props.history.push("/register");

        this.setState({ 
            msgbox: !this.state.msgbox
        });
    }

    render() {

        const date = new Date();
        const time = firebase.firestore.Timestamp.fromDate(date);

        const date_options = {
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        };

        return (
            <React.Fragment>
                {this.state.editing 
                ? 
                    <Insert advert={this.state.advert} editMode={this.editMode} /> 
                : 
                    <React.Fragment>
                        <div className="menu-intro">
                            <p>
                                Scade: <strong>{new Date(this.state.advert.expiry.seconds * 1000).toLocaleDateString('it', date_options)}</strong>
                            </p>
                            <p>
                                Azienda: <strong>{this.state.advert.enterprise}</strong>
                            </p>
                            <p>
                                Sita in: <strong>{this.state.advert.location}</strong>
                            </p>
                            {this.state.advert.contract.map(
                                (i) => (
                                            <p key={i}>
                                                {i}
                                            </p>
                                        )
                            )}
                        </div>
    
                        {this.state.msgbox === false 
                        ? 
                            <React.Fragment>
                                <div className="menu-details">
                                    {this.state.advert.introduction}
                                    <ul>
                                        {this.state.advert.requirements.map(
                                            (object) => (
                                                            <li key={object}>
                                                                {object}
                                                            </li>
                                                        )   
                                        )}
                                    </ul>
                                    {this.state.advert.month_salary > 0 && 
                                        <p>
                                            <strong>Stipendio</strong>: {this.state.advert.month_salary} € / mese
                                        </p>
                                    }
                                </div>
                                <div className="menu-button">
                                    {this.state.subscribed === false && this.state.advert.enterprise !== this.props.user_details.username && this.state.advert.expiry >= time && 
                                        <button 
                                            type="button" 
                                            className="candidate success" 
                                            onClick={this.showMsgBox}
                                        >
                                            Candidati
                                        </button>
                                    }
                                    {this.state.advert.expiry < time && 
                                        <div className="menu-error">
                                            <i className="fa fa-times fa-lg" /> Annuncio scaduto!
                                        </div>
                                    }
                                    {this.state.subscribed === true && 
                                        <div className="menu-success">
                                            <i className="fa fa-check fa-lg" /> Sei già iscritto a quest'annuncio!
                                        </div>
                                    }
                                    {this.state.advert.enterprise === this.props.user_details.username && this.state.advert.expiry >= time && 
                                        <button 
                                            type="button" 
                                            className="candidate success" 
                                            onClick={this.editMode}
                                        >
                                            <i className="fa fa-edit fa-lg" /> Modifica
                                        </button>
                                    }
                                </div>
                            </React.Fragment>
                        :
                            <Formik
                                initialValues={{ introduction: "", curriculum: "" }}
                                validationSchema={CandidateSchema}
                                validateOnBlur={false} 
                                validateOnChange={false}                    
                                onSubmit={(values, { resetForm }) => {
                                    var upload = firebase.storage().ref('Curriculums/' + this.props.user.uid).put(values.curriculum);
                                    upload.then(() => {
                                        upload.snapshot.ref.getDownloadURL().then(r => {
                                            var db = firebase.firestore();
                                            var today = new Date();
                                            db.collection('nominations').doc().set({
                                                advert_id: this.state.advert.id,
                                                candidate_id: this.props.user.uid,
                                                subscribed_at: firebase.firestore.Timestamp.fromDate(today)
                                            });
                                            axios.post("/api/candidate", {introduction: values.introduction, curriculum: r, advert: this.state.advert, user: this.props.user, user_details: this.props.user_details});
                                            toast.success("Candidatura inviata con successo.");
                                            this.setState({ msgbox: false, subscribed: true });
                                            resetForm({});
                                        });
                                    });
                                    upload.catch(err => console.log(err));
                                }}
                            >
                            {({
                                values,
                                touched,
                                errors,
                                handleChange,
                                handleBlur,
                                handleSubmit,
                                dirty,
                                setFieldValue
                            }) => (
                                <form onSubmit={handleSubmit}>
                                    <div className="menu-msgbox">
                                        <label htmlFor="introduction">
                                            Inserisci una lettera di presentazione (opzionale)
                                        </label>
                                        <textarea 
                                            placeholder="Lettera di presentazione" 
                                            rows={5} 
                                            name="introduction" 
                                            value={values.introduction} 
                                            onChange={handleChange} 
                                            onBlur={handleBlur} 
                                        />
                                        {touched.introduction && errors.introduction && 
                                            <div className="input-error">
                                                {errors.introduction}
                                            </div>
                                        }
                                        
                                        <label htmlFor="curriculum">
                                            Allega il tuo curriculum
                                        </label>
                                        <input 
                                            type="file" 
                                            name="curriculum" 
                                            accept=".doc, .docx, .pdf" 
                                            onChange={e => setFieldValue("curriculum", e.currentTarget.files[0])} 
                                            onBlur={handleBlur} 
                                        />
                                        {touched.curriculum && errors.curriculum && 
                                            <div className="input-error">
                                                {errors.curriculum}
                                            </div>
                                        }
                                    </div>
                                    <div className="menu-button">
                                        <button 
                                            type="button" 
                                            className="candidate error" 
                                            onClick={this.showMsgBox}
                                        >
                                            Indietro
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="candidate success" 
                                            disabled={!dirty}
                                        >
                                            Invia
                                        </button>
                                    </div>
                                </form>
                            )}
                            </Formik>
                        }
                    </React.Fragment>
                }
            </React.Fragment>
        );
    }
}

export default withRouter(Item);