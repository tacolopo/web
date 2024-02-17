import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { CompressedVideoLogo } from './logo/compressed-video';
import { FadeTransition } from './fade-transition';

export const SplashPage = ({ title, children }: { title: string; children: ReactNode }) => {
  return (
    <FadeTransition>
      <div className='absolute inset-0 flex w-screen items-center justify-center'>
        <CompressedVideoLogo noWords className='w-[calc(100%-25vw)]' />
      </div>
      <Card className='w-[608px]' gradient>
        <CardHeader className='items-start'>
          <CardTitle className='bg-text-linear bg-clip-text text-[40px] font-bold leading-9 text-transparent opacity-80'>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className='mt-4'>{children}</CardContent>
      </Card>
    </FadeTransition>
  );
};
