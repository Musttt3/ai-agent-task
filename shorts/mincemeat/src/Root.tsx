import React from 'react';
import {Composition} from 'remotion';
import {Mincemeat} from './Main';
import {DURATION_S, f, FPS, H, W} from './timeline';

export const Root: React.FC = () => (
  <Composition
    id="Mincemeat"
    component={Mincemeat}
    durationInFrames={f(DURATION_S)}
    fps={FPS}
    width={W}
    height={H}
    defaultProps={{captions: true, withAudio: false}}
  />
);
