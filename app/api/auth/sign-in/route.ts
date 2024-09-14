import { NextRequest, NextResponse } from 'next/server';
import { SignInResponse, AppError } from '@/types';
import { setSessionCookie } from '@/lib/cookies';
import { createSessionCookie, getCurrentUser } from '@/lib/firebase/server';
import { isAppError } from '@/utils/guards';
import { APP_ERROR_CODE, HTTP_STATUS_CODE, SESSION_COOKIE } from '@/constants';
import { parseBearerToken } from './parseBearerToken';

export const POST = async (request: NextRequest): Promise<NextResponse<SignInResponse>> => {
  try {
    const authHeader = request.headers.get('Authorization');

    const idToken = parseBearerToken(authHeader);

    const expiresInMs = SESSION_COOKIE.MAX_AGE_SECONDS * 1000;

    const sessionCookie = await createSessionCookie(idToken, { expiresIn: expiresInMs });

    if (!sessionCookie) {
      throw new AppError(APP_ERROR_CODE.UNEXPECTED_APP_ERROR, 'Failed to create session cookie.');
    }

    setSessionCookie(sessionCookie, SESSION_COOKIE.MAX_AGE_SECONDS);

    const user = await getCurrentUser();

    if (!user) {
      throw new AppError(APP_ERROR_CODE.USER_NOT_FOUND, 'Failed to retrieve user information after signing in.');
    }

    const response = NextResponse.json<SignInResponse>({
      error: null,
      data: {
        user,
      },
    });

    response.cookies.set(SESSION_COOKIE.NAME, sessionCookie, {
      maxAge: SESSION_COOKIE.MAX_AGE_SECONDS,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });

    return response;
  } catch (err) {
    const error = isAppError(err) ? err : new AppError(APP_ERROR_CODE.UNKNOWN_ERROR, 'Failed to sign in.');

    return NextResponse.json<SignInResponse>(
      {
        error: { ...error, message: error.message },
        data: null,
      },
      { status: HTTP_STATUS_CODE.OK }
    );
  }
};
