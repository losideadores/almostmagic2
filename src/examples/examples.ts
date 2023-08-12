import { config } from 'dotenv';
import { prompt } from 'enquirer';
import { generate, generateOrThrow } from '../generate';
import { $throw } from 'vovas-utils';
import { GenerateMeta } from '../types';

if (require.main === module) {
  (async () => {

    config();

    // Prompt the user what kind of examples they want to run
    const { example } = await prompt<{ example: string }>({
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

          const { email } = await prompt<{ email: string }>({
            type: 'input',
            name: 'email',
            message: 'Enter an email address',
          });

          const { name } = await generateOrThrow('name', { email }, { meta });
          
          console.log(`Here’s a name based on the email address: ${name}`);

          break;

        case 'nation-attitude':

          const { nation, topic } = await prompt<{ nation: string, topic: string }>([
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

          const { detailedAttitudeDescription: attitude } = await generateOrThrow('detailedAttitudeDescription', { nation, topic }, { meta })

          console.log(attitude);

        default:

          break;

      };
    } catch (err) {
      console.log({ meta })
    }


  })();
}
