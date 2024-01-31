import { useStyletron } from 'baseui';
import { AspectRatioBox, AspectRatioBoxBody } from 'baseui/aspect-ratio-box';
import { Button } from 'baseui/button';
import { Heading, HeadingLevel } from 'baseui/heading';
import { Label1, LabelLarge, Paragraph1 } from 'baseui/typography';
import LightScreenshot1 from 'Client/assets/images/preview2.png';
import SvgGithub from 'Client/generatedSvgComponents/Github';
import SvgLogo from 'Client/generatedSvgComponents/Logo';
import SvgMarkdown from 'Client/generatedSvgComponents/Markdown';
import SvgVsCode from 'Client/generatedSvgComponents/Vscode';
import { loginWithGithub } from 'Client/slices/session/epics';
import { isLoggedInWithGithubSelector } from 'Client/slices/session/slice';
import { REGULAR_PAGE_FLOW_MAX_WIDTH } from 'Client/styleConstants';
import __pipe from 'lodash/fp/pipe';
import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

const SECTION_ICON_WIDTH = '100px';

export function LandingPage() {
  const [css, theme] = useStyletron();
  const isLoggedIn = useSelector(isLoggedInWithGithubSelector);
  if (isLoggedIn) {
    return <Redirect to={'/rooms'} />;
  }
  return (
    <article
      className={css({
        marginTop: '2px',
        marginLeft: 'auto',
        marginRight: 'auto',
        maxWidth: REGULAR_PAGE_FLOW_MAX_WIDTH,
      })}
    >
      <HeadingLevel>
        <div
          className={css({
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            // height: '700px',
            flexWrap: 'wrap',
            alignItems: 'center',
            // justifyContent: 'center',
          })}
        >
          <span
            className={css({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              marginBottom: '5px',
              textAlign: 'center',
              marginRight: '8px',
            })}
          >
            <Heading styleLevel={1} className={css({ textAlign: 'center' })}>
              Take notes in real time.
            </Heading>
            <span className={css({ display: 'flex', alignItems: 'center' })}>
              <Button onClick={() => loginWithGithub()}>Login With Github</Button>
            </span>
          </span>
        </div>
      </HeadingLevel>
    </article>
  );
}

function FeatureListItem({
  label,
  Icon,
  href,
}: {
  label: ReactNode;
  href: string;
  Icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}) {
  const [css, theme] = useStyletron();
  return (
    <Button
      kind="tertiary"
      $as="a"
      href={href}
      overrides={{ Root: { style: { width: '200px', display: 'flex', flexDirection: 'column' } } }}
    >
      {/* <li
        className={css({
          color: theme.colors.contentPrimary,
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
        })}
      > */}
      {Icon && <Icon height="4rem" fill={theme.colors.contentPrimary} />}
      {label}
    </Button>
  );
}

function FeatureSection({
  label,
  children,
  id,
  imageSide,
}: {
  label: ReactNode;
  children: ReactNode;
  id: string;
  imageSide: 'left' | 'right';
}) {
  const [css, theme] = useStyletron();
  const paragraph = <p>{children}</p>;
  const image = (
    <div className={css({ backgroundColor: theme.colors.backgroundInversePrimary, width: '500px', height: '600px' })} />
  );
  return (
    <>
      <h1 id={id} className={css({ color: theme.colors.contentPrimary })}>
        {label}
      </h1>
      <section className={css({ color: theme.colors.contentPrimary })}>
        {imageSide === 'left' ? (
          <>
            {image}
            {paragraph}
          </>
        ) : (
          <>
            {paragraph}
            {image}
          </>
        )}
      </section>
    </>
  );
}
