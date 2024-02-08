import * as React from 'react';

function SvgLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={88} height={72} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M28.656 47.063c0-1.771-.625-3.126-1.875-4.063-1.25-.958-3.5-1.958-6.75-3-3.25-1.063-5.823-2.104-7.718-3.125-5.167-2.792-7.75-6.552-7.75-11.281 0-2.459.687-4.646 2.062-6.563 1.396-1.937 3.385-3.448 5.969-4.531 2.604-1.083 5.52-1.625 8.75-1.625 3.25 0 6.146.594 8.687 1.781 2.542 1.167 4.51 2.823 5.907 4.969 1.416 2.146 2.124 4.583 2.124 7.313h-9.374c0-2.084-.657-3.698-1.97-4.844-1.312-1.167-3.155-1.75-5.53-1.75-2.292 0-4.073.49-5.344 1.468-1.271.959-1.906 2.23-1.906 3.813 0 1.48.74 2.719 2.218 3.719 1.5 1 3.698 1.937 6.594 2.812 5.333 1.604 9.219 3.594 11.656 5.969 2.438 2.375 3.657 5.333 3.657 8.875 0 3.938-1.49 7.031-4.47 9.281-2.978 2.23-6.989 3.344-12.03 3.344-3.5 0-6.688-.635-9.563-1.906-2.875-1.292-5.073-3.052-6.594-5.282-1.5-2.229-2.25-4.812-2.25-7.75h9.406c0 5.021 3 7.532 9 7.532 2.23 0 3.97-.448 5.22-1.344 1.25-.917 1.874-2.188 1.874-3.813zM81.438 59h-9.376l-18.25-29.938V59h-9.374V13.5h9.374l18.282 30v-30h9.344V59zM1 65.25h84.563v3.125H1V65.25z"
        fill="#000"
      />
      <path
        d="M26.781 43l-.608.794.008.006.6-.8zm-6.75-3l-.31.95.005.002.305-.952zm-7.718-3.125l-.476.88h.001l.475-.88zM6.625 19.031l-.811-.584-.002.001.813.583zm5.969-4.531l-.384-.923h-.003l.387.923zm17.437.156l-.423.906.006.003.417-.909zm5.907 4.969l-.839.545.004.006.834-.551zm2.124 7.313v1h1v-1h-1zm-9.374 0h-1v1h1v-1zm-1.97-4.844l-.664.747.007.006.658-.753zm-10.874-.282l.602.799.008-.006-.61-.793zm.312 7.532l-.56.828.005.004.555-.832zm6.594 2.812l-.29.958h.002l.288-.958zm10.844 24.125l.599.8.003-.002-.602-.798zM12 57.72l-.41.912.006.002.404-.914zm-6.594-5.282l-.83.559.004.005.826-.563zm-2.25-7.75v-1h-1v1h1zm9.406 0h1v-1h-1v1zm14.22 6.188l.582.813.009-.007-.592-.806zm2.874-3.813c0-2.037-.737-3.709-2.275-4.862l-1.2 1.6c.962.722 1.475 1.758 1.475 3.263h2zm-2.266-4.856c-1.398-1.07-3.791-2.113-7.053-3.158l-.611 1.904c3.238 1.038 5.344 1.996 6.447 2.842l1.217-1.588zm-7.048-3.157c-3.222-1.053-5.733-2.073-7.555-3.054l-.949 1.76c1.97 1.06 4.605 2.124 7.883 3.195l.621-1.9zm-7.554-3.054c-4.936-2.667-7.226-6.134-7.226-10.401h-2c0 5.19 2.878 9.244 8.275 12.16l.95-1.759zM5.562 25.594c0-2.259.628-4.24 1.876-5.98l-1.626-1.166c-1.502 2.094-2.25 4.488-2.25 7.146h2zm1.874-5.978c1.271-1.764 3.101-3.17 5.544-4.194l-.773-1.844c-2.723 1.142-4.872 2.758-6.393 4.869l1.622 1.169zm5.542-4.193c2.466-1.026 5.25-1.548 8.366-1.548v-2c-3.342 0-6.392.56-9.134 1.702l.768 1.846zm8.366-1.548c3.127 0 5.874.57 8.264 1.687l.846-1.812c-2.693-1.258-5.737-1.875-9.11-1.875v2zm8.27 1.69C32 16.66 33.816 18.198 35.1 20.17l1.677-1.09c-1.509-2.32-3.63-4.095-6.328-5.333l-.834 1.818zm5.489 4.611c1.302 1.972 1.96 4.216 1.96 6.762h2c0-2.913-.76-5.544-2.291-7.864l-1.669 1.102zm2.96 5.762h-9.376v2h9.375v-2zm-8.376 1c0-2.31-.738-4.225-2.31-5.598l-1.316 1.507c1.052.919 1.627 2.234 1.627 4.09h2zm-2.304-5.592c-1.552-1.379-3.663-2.002-6.195-2.002v2c2.217 0 3.793.543 4.866 1.497l1.33-1.495zm-6.195-2.002c-2.421 0-4.448.515-5.955 1.676l1.221 1.585c1.035-.798 2.57-1.261 4.733-1.261v-2zm-5.946 1.67c-1.52 1.146-2.305 2.712-2.305 4.611h2c0-1.267.487-2.244 1.509-3.014l-1.204-1.597zm-2.305 4.611c0 1.883.97 3.405 2.66 4.547l1.12-1.657c-1.27-.858-1.78-1.814-1.78-2.89h-2zm2.665 4.55c1.618 1.08 3.923 2.052 6.859 2.939l.578-1.915c-2.856-.863-4.947-1.766-6.328-2.687l-1.11 1.664zm6.86 2.939c5.266 1.584 8.975 3.514 11.246 5.727l1.396-1.432c-2.604-2.537-6.665-4.586-12.066-6.21l-.576 1.915zm11.246 5.727c2.236 2.179 3.355 4.875 3.355 8.159h2c0-3.8-1.32-7.02-3.959-9.591l-1.396 1.432zM37.063 47c0 3.644-1.358 6.434-4.072 8.483l1.205 1.596c3.245-2.45 4.867-5.848 4.867-10.079h-2zm-4.068 8.48c-2.754 2.061-6.531 3.145-11.432 3.145v2c5.181 0 9.426-1.145 12.63-3.543l-1.198-1.601zm-11.432 3.145c-3.377 0-6.425-.612-9.159-1.82l-.808 1.828c3.016 1.334 6.343 1.992 9.966 1.992v-2zm-9.153-1.818c-2.736-1.23-4.777-2.88-6.178-4.933L4.58 53c1.641 2.406 3.996 4.276 7.01 5.63l.82-1.824zm-6.174-4.928c-1.379-2.049-2.08-4.433-2.08-7.191h-2c0 3.116.8 5.898 2.42 8.308l1.66-1.117zm-3.08-6.191h9.406v-2H3.156v2zm8.406-1c0 2.715.82 4.918 2.609 6.415 1.754 1.468 4.277 2.116 7.392 2.116v-2c-2.886 0-4.863-.608-6.109-1.65-1.211-1.014-1.892-2.577-1.892-4.882h-2zm10 8.53c2.349 0 4.321-.469 5.802-1.53l-1.165-1.626c-1.02.73-2.526 1.157-4.637 1.157v2zm5.81-1.537c1.522-1.115 2.284-2.693 2.284-4.618h-2c0 1.324-.487 2.288-1.466 3.006l1.183 1.612zM81.439 59v1h1v-1h-1zm-9.376 0l-.853.52.292.48h.561v-1zm-18.25-29.938l.854-.52-1.853-3.041v3.561h1zm0 29.938v1h1v-1h-1zm-9.374 0h-1v1h1v-1zm0-45.5v-1h-1v1h1zm9.374 0l.854-.52-.292-.48h-.562v1zm18.282 30l-.854.52 1.854 3.043V43.5h-1zm0-30v-1h-1v1h1zm9.344 0h1v-1h-1v1zm0 44.5h-9.376v2h9.376v-2zm-8.522.48l-18.25-29.938-1.707 1.041 18.25 29.938 1.707-1.041zM52.813 29.063V59h2V29.062h-2zm1 28.937h-9.376v2h9.376v-2zm-8.376 1V13.5h-2V59h2zm-1-44.5h9.376v-2h-9.376v2zm8.522-.48l18.28 30 1.709-1.04-18.282-30-1.707 1.04zM73.094 43.5v-30h-2v30h2zm-1-29h9.344v-2h-9.344v2zm8.344-1V59h2V13.5h-2zM1 65.25v-1H0v1h1zm84.563 0h1v-1h-1v1zm0 3.125v1h1v-1h-1zM1 68.375H0v1h1v-1zm0-2.125h84.563v-2H1v2zm83.563-1v3.125h2V65.25h-2zm1 2.125H1v2h84.563v-2zM2 68.375V65.25H0v3.125h2z"
        fill="#000"
      />
    </svg>
  );
}

export default SvgLogo;
