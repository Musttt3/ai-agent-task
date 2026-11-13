import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {Captions} from './Captions';
import {Graphics} from './Graphics';
import {loadFonts} from './lib';
import {FilmLook, ShotTrack, TransitionFX} from './Shots';

loadFonts();

export type MainProps = {captions: boolean; withAudio: boolean};

export const Mincemeat: React.FC<MainProps> = ({captions, withAudio}) => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <ShotTrack />
    <TransitionFX />
    <FilmLook />
    <Graphics />
    {captions ? <Captions /> : null}
    {withAudio ? <Audio src={staticFile('audio/mix.wav')} /> : null}
  </AbsoluteFill>
);
