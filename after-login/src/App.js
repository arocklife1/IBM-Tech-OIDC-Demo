import "./app.scss"
import React, { Component } from 'react';
import TutorialHeader from "./components/Tutorialheader";
import { Route, Routes } from 'react-router-dom';
import LandingPage from './content/LandingPage';
import RepoPage from './content/RepoPage';
import { Content, Theme } from '@carbon/react';

//App Routing for what to load for each URL and sets the theme to 'g100' (the dark theme)
class App extends Component {
  render() {
    return (
      <>
      {/* sets the theme to "dark" */}
        <Theme theme="g100">
          <TutorialHeader />
        </Theme>
        <Theme theme='g100'>
        <Content>
          {/*Sets the two routes for the app*/}
          <Routes>
            <Route exact path="/" element={<LandingPage />}/>
            <Route path="/links" element={<RepoPage />}/>
          </Routes>
        </Content>
        </Theme>
      </>

    );
  }
}

export default App;
