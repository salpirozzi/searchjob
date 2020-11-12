import React, { Component } from 'react';
import { withRouter } from "react-router-dom";
import firebase from './firebase';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

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
            subscribed: false 
        };
        this.showMsgBox = this.showMsgBox.bind(this);     
    }

    showMsgBox(e) {
        e.preventDefault();

        if(this.state.subscribed === true) return 0;

        if(this.props.user === null) 
            return this.props.history.push("/register");

        this.setState({ msgbox: !this.state.msgbox });
    }

    render() {

        var db = firebase.firestore();
        var index = this.props.advert_info.id;
        var query = db.collection('nominations');
                    query = query.where("advert_id", "==", index);
                    query = query.where("candidate_id", "==", this.props.user.uid);

        query.get().then(res => {
            var subscribed = (res.docs.length < 1) ? false : true;
            this.setState({ subscribed: subscribed });
        });

        return (
            <div className="App">
                    <div className="menu-intro">
                        <p>{this.props.advert_info.enterprise} - {this.props.advert_info.location}</p>
                        {this.props.advert_info.contract.map(i => <p key={i}>{i}</p>)}
                   </div><hr />
                   {this.state.msgbox === false && <React.Fragment>
                        <div className="menu-details">
                            {this.props.advert_info.introduction}
                            <ul>{this.props.advert_info.requirements.map(object => <li key={object}>{object}</li>)}</ul>
                            {this.props.advert_info.month_salary > 0 && <p><strong>Stipendio</strong>: {this.props.advert_info.month_salary} € / mese</p>}
                        </div>
                        <div className="menu-button">
                            {this.state.subscribed === false && <button className="insert candidate" onClick={this.showMsgBox}>Candidati</button>}
                            {this.state.subscribed === true && <div className="menu-subscribed"><i className="fa fa-check fa-lg" /> Sei già iscritto a quest'annuncio!</div>}
                        </div>
                   </React.Fragment>}
                   {this.state.msgbox === true && <React.Fragment>
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
                                           advert_id: this.props.advert_info.id,
                                           candidate_id: this.props.user.uid,
                                           subscribed_at: firebase.firestore.Timestamp.fromDate(today)
                                       })
                                       axios.post("/api/candidate", {introduction: values.introduction, curriculum: r, advert: this.props.advert_info, user: this.props.user, user_details: this.props.user_details});
                                       toast.success("Candidatura inviata con successo.");
                                       this.setState({ msgbox: false, subscribed: true });
                                       resetForm({});
                                   });
                               })
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
                                   <label htmlFor="introduction"><strong>Inserisci una lettera di presentazione</strong> (opzionale)</label>
                                   <textarea placeholder="Lettera di presentazione" rows={5} name="introduction" value={values.introduction} onChange={handleChange} onBlur={handleBlur} />
                                   {touched.introduction && errors.introduction && <div className="input-error">{errors.introduction}</div>}

                                   <label htmlFor="curriculum"><strong>Allega il tuo curriculum</strong></label>
                                   <input type="file" name="curriculum" accept=".doc, .docx, .pdf" onChange={e => setFieldValue("curriculum", e.currentTarget.files[0])} onBlur={handleBlur} />
                                   {touched.curriculum && errors.curriculum && <div className="input-error">{errors.curriculum}</div>}
                               </div>
                               <div className="menu-button">
                                    <button className="back candidate" onClick={this.showMsgBox}>Indietro</button>
                                    <button type="submit" className="insert candidate" disabled={!dirty}>Invia</button>
                               </div>
                           </form>
                           )}
                       </Formik>
                       </React.Fragment>
                    }
            </div>
        );
    }
}

export default withRouter(Item);