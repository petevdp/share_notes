import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Heading, HeadingLevel } from 'baseui/heading';
import { getLoginWithGithubHref, loginWithGithub } from 'Client/slices/session/epics';
import { isLoggedInWithGithubSelector } from 'Client/slices/session/slice';
import { REGULAR_PAGE_FLOW_MAX_WIDTH } from 'Client/styleConstants';
import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

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
              <Button href={getLoginWithGithubHref()} onClick={() => loginWithGithub()} $as="a">
                Login With Github
              </Button>
            </span>
          </span>
        </div>
      </HeadingLevel>
    </article>
  );
}
