import Link from "next/link";

export default function Home() {
  return (
    <div className="dev-landing d-flex align-items-center justify-content-center p-4">
      <main className="card shadow-sm" style={{ maxWidth: "32rem" }}>
        <div className="card-body p-4 p-md-5">
          <p className="text-uppercase small fw-medium text-warning-emphasis mb-1">
            Corduroy Platform
          </p>
          <h1 className="h3 mb-3">Local development</h1>
          <p className="text-body-secondary">
            This app serves two surfaces from one codebase. Use subdomain URLs in
            development — plain <code>localhost</code> shows this landing page.
          </p>
          <ul className="list-unstyled mt-4 mb-0">
            <li className="mb-2">
              <Link
                href="http://app.localhost:3000/dashboard"
                className="link-warning link-offset-2"
              >
                Client portal → app.localhost:3000
              </Link>
            </li>
            <li>
              <Link
                href="http://staff.localhost:3000/dashboard"
                className="link-dark link-offset-2"
              >
                Staff console → staff.localhost:3000
              </Link>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
