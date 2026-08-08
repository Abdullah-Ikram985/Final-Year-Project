import "./Login.css";

const Login = () => {
  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          A
        </div>

        <h1>Welcome Back</h1>

        <p className="login-subtitle">
          Login to your admin account
        </p>

        <form>

          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
            />
          </div>

          <div className="login-options">
            <label className="remember">
              <input type="checkbox" />
              Remember me
            </label>

            <button
              type="button"
              className="forgot-btn"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="login-btn"
          >
            Login
          </button>

        </form>

      </div>

    </div>
  );
};

export default Login;