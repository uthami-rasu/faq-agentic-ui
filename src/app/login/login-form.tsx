"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { error: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  return <form action={action} className="login-form">
    <label><span>Email address</span><div><Mail size={17}/><input name="email" type="email" autoComplete="username" placeholder="you@company.com" required autoFocus/></div></label>
    <label><span>Password</span><div><LockKeyhole size={17}/><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" minLength={10} required/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
    {state.error && <p className="login-error" role="alert">{state.error}</p>}
    <button className="login-submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={18}/> : <LockKeyhole size={17}/>} {pending ? "Signing in…" : "Sign in securely"}</button>
  </form>;
}
