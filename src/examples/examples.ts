import { config } from 'dotenv';
import { prompt } from 'enquirer';
import { generateOrThrow } from '../generate';
import { GenerateMeta } from '../types';

if ( require.main === module ) {
  run ();
}

export async function run() {

  config();

  debugger;

  // Prompt the user what kind of examples they want to run
  const { example } = await prompt<{ example: string; }>({
    type: 'select',
    name: 'example',
    message: 'Which example do you want to run?',
    choices: [
      { message: 'Come up with a person’s name based on their email address', name: 'name-from-email' },
      { message: 'Describe a nation’s attitude to a certain topic', name: 'nation-attitude' },
      // tbd
    ],
  });

  const meta = new GenerateMeta();

  try {
    // Run the example
    switch (example) {
      case 'name-from-email':

        const { email } = await prompt<{ email: string; }>({
          type: 'input',
          name: 'email',
          message: 'Enter an email address',
        });

        const { firstName, lastName } = await generateOrThrow(['firstName', 'lastName'], { email }, { meta });

        console.log({ firstName, lastName });

        break;

      case 'nation-attitude':

        const { nation, topic } = await prompt<{ nation: string; topic: string; }>([
          {
            type: 'input',
            name: 'nation',
            message: 'Enter a nation',
          },
          {
            type: 'input',
            name: 'topic',
            message: 'Enter a topic',
          },
        ]);

        const { attitude } = await generateOrThrow({
          attitude: "Detailed description of a nation's attitude to a certain topic, including any historical context, current events, and future forecasts."
        }, { nation, topic }, { meta });

        console.log({ attitude });

      default:

        break;

    };
  } catch (err) {
    console.log({ meta });
  }


};
