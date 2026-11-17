import React from 'react'
import { Composition } from 'remotion'
import { Explainer, getVideo, totalFrames } from './Explainer'
import { FPS, H, W } from './theme'
import timeline from './timeline.json'

export const Root: React.FC = () => (
  <>
    {(timeline as unknown as { videos: { id: string }[] }).videos.map(({ id }) => (
      <Composition key={id} id={id} component={Explainer} defaultProps={{ id }} durationInFrames={totalFrames(getVideo(id))} fps={FPS} width={W} height={H} />
    ))}
  </>
)
