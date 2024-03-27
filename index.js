const { Script, createContext } = require("vm");

const AWS = require("aws-sdk");
const lambda = new AWS.Lambda();
const axios = require("axios");

async function runPythonCode(code) {
  try {
    const response = await axios.post(
      "https://9kl9qj1fxi.execute-api.ap-south-1.amazonaws.com/production/python-code",
      {
        code: code,
      }
    );

    // const response = await lambda.invoke(params).promise();

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(response.data);
    }
  } catch (error) {
    return error.message;
  }
}

async function runJavaScriptCode(code) {
  try {
    const logs = []; // Array to accumulate log outputs
    const sandbox = {
      console: {
        log: (...args) => {
          logs.push(args.join(" ")); // Push the logged message to the logs array
        },
      },
      // You can add more global objects or functions if needed
    };
    const context = createContext(sandbox);
    const script = new Script(code);
    script.runInNewContext(context);
    return Promise.resolve(logs.join("\n")); // Join all logged messages with newline
  } catch (err) {
    return Promise.reject(err);
  }
}

exports.handler = async (event) => {
  const language = event.language;
  const code = event.code;

  try {
    let result;
    if (language === "python") {
      result = await runPythonCode(code);
    } else if (language === "javascript") {
      result = await runJavaScriptCode(code);
    } else {
      throw new Error("Unsupported language.");
    }
    return {
      statusCode: 200,
      body: result,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: error.message,
    };
  }
};

// Local test
// (async () => {
//   const testEvent = {
//     language: "javascript",
//     code: `console.log("Hello from JavaScript!");
//         function greet(name) {
//             console.log("Hello, " + name + "!");
//         }
//         greet("Alice");
//         greet("Bob");`,
//   };
//   try {
//     const output = await exports.handler(testEvent);
//     console.log(output);
//   } catch (err) {
//     console.error(err);
//   }
// })();
