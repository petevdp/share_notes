// import { Convergence } from "@convergence/convergence";

// const url = "https://convergence-server.myhost.com/mynamespace/mydomain";
// const credentials = { username: "myuser", password: "mypassword" };

// Convergence.connectWithPassword(url, credentials)
//   .then((domain) => {
//     // open an employee data model.
//     return domain.models().open("employees", "doe.john");
//   })
//   .then((model) => {
//     // Get the root elemenet in the model.
//     const data = model.root();

//     // Set some data
//     data.set("fisrtName", "John");
//     data.set("lastName", "Doe");

//     // Get the firstName property directly
//     const firstName = data.elementAt("firstName");

//     // Rest the first name's value
//     firstName.value("Dan");

//     // Listen for course grained changes
//     firstName.on("value", () => {
//       console.log(firstName.value);
//     });

//     // Insert 'ny' into the string at index 3.
//     firstName.insert(3, "ny");

//     // Listen for course grained changes
//     firstName.on("insert", (evt) => {
//       console.log(`characters '${evt.value}' added at position (${evt.index})`);
//     });
//   });

const msg: string = "hi there";

console.log(msg);
