# It’s almost magic!

`almostmagic` is a package that allows you to generate structured data using OpenAI's large language models (e.g. GPT-3.5/4). It's designed to be easy to use, with just one line of code needed in most cases, and highly compatible with TypeScript.

*Note: For easier navigation and API reference, check out the [documentation](https://losideadores.github.io/almostmagic2/) page.*

## Do I need it?

Before diving into the technicalities of `almostmagic`, you might be wondering if you really need this package. After all, couldn't you just use the OpenAI SDK directly?

The answer depends on your specific needs and use case. Here are a few reasons why you might want to consider using `almostmagic`:

1. **Structured data generation**: The main selling point of `almostmagic` is its ability to generate structured data. Whether you need to generate an array of strings, a complex object with nested properties, or even a single value with a specific type, `almostmagic` has got you covered. This is particularly useful when you need to generate data that fits a specific schema or when you want to generate multiple related pieces of data in a single call.

2. **Ease of use**: `almostmagic` simplifies the process of generating structured data using OpenAI's language models. You can define the structure of the data you want to generate in a simple, intuitive way, and `almostmagic` will take care of the rest. This can save you a lot of time and effort compared to manually crafting prompts and parsing the responses from the OpenAI API.

3. **Type inference**: `almostmagic` automatically infers the types of the properties it's generating based on their descriptions. This can be a huge time-saver if you're working with TypeScript, as you don't have to manually define types for each property.

In summary, if you're looking for a way to generate structured data using OpenAI's language models that is easy to use, flexible, and TypeScript-friendly, `almostmagic` might be just what you need. However, if you need more control over the generation process or want to use features that are not supported by `almostmagic`, you might be better off using the OpenAI SDK directly.

## Installation

```bash
npm install almostmagic
```

## Usage

Here's a simple example of how you can use `almostmagic` to generate an article's title, intro, and outline based on a given topic:

```typescript
import { generate } from 'almostmagic';

await generate(
  {
    title: 'article title',
    intro: 'lead paragraph for the article, written in an engaging style',
    outline: 'section titles (array of strings)',
  } as const, // `as const` is necessary for correct type inference, see below
  { topic: 'quantum computing' },
  { openaiApiKey: 'sk-[...]' } // See "Authentication" section below
);

// {
//   title: "Unlocking the Potential: Exploring the World of Quantum Computing",
//   intro: "Quantum computing is a rapidly advancing field that holds immense potential for revolutionizing the way we process information. In this article, we will delve into the fundamentals of quantum computing and how it differs from classical computing. Join us on this exciting journey as we explore the principles, applications, and challenges surrounding quantum computing.",
//   outline: [
//     "I. The Basics: Understanding Quantum Computing",
//     "II. Quantum Versus Classical: Key Differences",
//     "III. Quantum Computing Algorithms: Unleashing Power",
//     "IV. Real-world Applications: From Optimization to Drug Discovery",
//     "V. Challenges and Future Perspectives"
//   ]
// }
```

In this example, `generate` is a function that takes two arguments: output specifications and inputs. The output specifications define the structure of the data you want to generate (see [Type Inference](#md:type-inference) for more details). The inputs are the data you provide to the function.

**NB: The `as const` assertion above is necessary for correct type inference. It tells TypeScript to infer the literal types of the properties, rather than their general types.**

## Generation quality and other OpenAI parameters

By default, `almostmagic` uses the `gpt-3.5-turbo` model, which is less powerful (but also ~10x cheaper and much faster) than the `gpt-4` model. You can change this by setting the `model` option:

```typescript
await generate('A short story', { genre: 'sci-fi' }, { model: 'gpt-4' });
```

You can also set all the following [parameters](https://beta.openai.com/docs/api-reference/completions/create) that OpenAI’s API supports: `model` (as mentioned above), `temperature`, `top_p` (here and below, note the snake_case), `max_tokens`, `presence_penalty`, `frequency_penalty`, `logit_bias`, `user`.

```typescript
await generate('A nursery rhyme', { topic: 'zombies' }, { temperature: 1 });
```

You can also set any of the OpenAI [config parameters](https://github.com/openai/openai-node/blob/master/src/index.ts), for example `dangerouslyAllowBrowser` to allow testing your code in the browser (not recommended for production use) or `organization` to set the organization ID for your request(s).


## Defining output specifications (specs)

A large part of the "magic" in `almostmagic` is that it allows you to define the structure of the data you want to generate in a simple, intuitive way. You basically just ask for what you want it to provide, and it gives it to you. We call this "output specifications", or just "specs" for short.

The output specifications can be defined as a single string, an array of strings, or an object.

### Single-string specs

If you provide a single string as the output specifications, `almostmagic` will treat it as a description of what you want to generate.

In this case, `generate` will return a single value of a type inferred according to [Type Inference](#md:type-inference) below.

For example:

```typescript
await generate(
  'An unusual but plausible idea for a new software product (string)', 
  { area: 'healthcare' }
);

// "IntelliDoc: A revolutionary AI-powered documentation assistant in healthcare"
```

### Array specs

If you provide an array of strings as the output specifications, `almostmagic` will treat each string as the *name* (not description) of a property you want to generate. For example:

```typescript
await generate(
  ['name', 'tagline', 'pitch'],
  { area: 'education' }
);

// {
//   name: "Edulite",
//   tagline: "Navigate the path of knowledge",
//   pitch: "Empowering learners through innovative educational solutions. Edulite, your trusted companion in the world of education. Discover new possibilities and achieve academic excellence with our personalized learning experience. Join our community and unlock your true potential today!"
// }
```

### Object specs

If you provide an object as the output specifications, `almostmagic` will treat each property key as the name of a property you want to generate and each property value as the description of that property. This is useful when default (name-based) generations don't work well for your use case.

For example, in the first example in [Usage](#md:usage) above, we used an object to make sure `intro` is generated as a lead paragraph, not just one sentence, and that `outline` is generated as an array of strings, not just a single string.

## Defining inputs

Whatever you want `almostmagic` to generate, you probably want it to generate it *for* something: a title *for* an article, a name *for* a product, a summary *for* a webpage, etc. This is what the inputs are for.

Inputs can be define in very arbitrary ways, from a single string to a complex object. The only requirement is that they are ”yamlifiable”, i.e. can be converted to YAML format, as this is the way they are (under the hood) sent to OpenAI’s API as part of the prompt.

So you can do either of the following:

```typescript
await generate(
  'An ELI5, five-sentence explanation of a complex topic',
  'A feedforward neural network (FNN) is one of the two broad types of artificial neural network, characterized by direction of the flow of information between its layers.[2] Its flow is uni-directional, meaning that the information in the model flows in only one direction—forward—from the input nodes, through the hidden nodes (if any) and to the output nodes, without any cycles or loops,[2] in contrast to recurrent neural networks,[3] which have a bi-directional flow.',
  { model: 'gpt-4' }
);

// "Imagine you're on a one-way street (this is our feedforward neural network), where you can only move forward. You start at the beginning of the street (the input nodes), and you might go on a tour inside some buildings along the street (the hidden nodes). Finally, you end up at the end of the street (the output nodes). You can't turn back or create a loop on this street, you only move in one direction. This is different from other streets where you can go both ways (recurrent neural networks)."

await generate(
  'A random quote',
  { author: 'Albert Einstein', topic: 'love', mood: 'optimistic' }
)

// '“Gravitation is not responsible for people falling in love. Love is an infinite force that connects hearts and minds, transcending even the boundaries of time and space. With love, humanity has the power to create a world full of compassion, understanding, and harmonious coexistence.” - Albert Einstein'

await generate(
  'Next number in sequence (number)',
  [1, 2, 3, 5, 8, 13, 21]
)

// 34
```

## Type inference

`almostmagic` uses a set of simple rules to infer the types of the properties it's generating based on their descriptions. These rules are as follows:

### From descriptions

1. If the description is exactly "number" or ends with "(number)", the type will be inferred as a `number`.
2. If the description is exactly "boolean" or starts with "true if " or ends with "(boolean)", the type will be inferred as a `boolean`.
3. If the description starts with "array of numbers" or ends with "(array of numbers)", the type will be inferred as `number[]`.
4. If the description starts with "array of strings" or ends with "(array of strings)", the type will be inferred as `string[]`.
5. If the description starts with "string" or ends with "(string)", the type will be inferred as a `string`.
6. Otherwise, the type will be inferred as a `string`.

Note that in cases 3—5, "starts with" also covers "is exactly". Also, all descriptions are case-insensitive.

### From names

1. If the name starts with "is" or ends with "Boolean", the type will be inferred as a `boolean`.
2. If the name ends with "Array", the type will be inferred as `string[]`.
3. If the name ends with "String", the type will be inferred as a `string`.

Unlike descriptions, names are case-sensitive.

### Example

```typescript
await generate(
  {
    name: 'Sample product name for an online store demo', // Will be inferred as a string by default, no need to specify
    description: 'Sample product description',
    price: 'Number',
    isAvailable: 'Boolean', // Note that `boolean` is redundant here, as 'is...' names are inferred as booleans by default
    features: 'Array of strings',
    ratings: 'Recent ratings on a scale of 1 to 5 (array of numbers)',
  } as const,
  { category: 'fashion' }
);

// {
//   name: "Stylish T-shirt",
//   description: "A fashionable t-shirt that offers comfort and style.",
//   price: 29.99,
//   isAvailable: true,
//   features: [
//     "Soft and breathable fabric",
//     "Modern design",
//     "Available in different sizes"
//   ],
//   ratings: [
//     4,
//     5,
//     4,
//     4,
//     3
//   ]
// }
```

## Authentication

`almostmagic` is essentially a wrapper around OpenAI’s API. To use it, you’ll need to [create an OpenAI account](https://beta.openai.com/) and [generate an API key](https://beta.openai.com/account/api-keys). All the usual [precautions](https://platform.openai.com/docs/api-reference/authentication) regarding API keys apply.

**NB: `almostmagic` does NOT use any other (intermediate) servers to process your requests. All requests are sent directly to OpenAI’s API. Thus, your API key is as safe as it would be if you were using OpenAI’s API directly.**

You can set your API key in one of four ways:

1. As an environment variable named `OPENAI_API_KEY`.

2. Directly as part of the third argument to `generate`:

```typescript
await generate(
  'Baby name ideas (array of strings)',
  { origin: 'Slavic' },
  { openaiApiKey: 'sk-[...]' }
);
```

3. By using `addDefaultOptions`:

```typescript
import { addDefaultOptions, generate } from 'almostmagic';

addDefaultOptions({ openaiApiKey: 'sk-[...]' });
await generate(['name', 'tagline', 'pitch'], { area: 'education' });
```

4. By using an instance of `Generator` (see [Instantiation](#md:instantiation) below):

```typescript
import { Generator } from 'almostmagic';

const randomNameGenerator = new Generator(
  ['firstName', 'lastName', 'birthYearNumber'],
  { openaiApiKey: 'sk-[...]' }
);
randomNameGenerator.generateFor({ ethnicity: 'Southeast Asian' });
```

## Instantiation

`almostmagic` exports a `Generator` class that you can use to instantiate generators with custom options. This can be handy if you want to reuse the same options or output specifications from multiple locations in your code.

For example:

```typescript
import { Generator } from 'almostmagic';

const magic = new Generator(
  'Concise, well-structured and commented code based on the user’s request (string)',
  { openaiApiKey: 'sk-[...]' }
);

await magic.generate(
  'Concise, well-structured and commented code based on the user’s request (string)',
  { request: 'A factorial function', language: 'JavaScript' }
);

// function factorial(n) {
//   if (n < 0) {
//     return null;
//   }
//   if (n === 0) {
//     return 1;
//   }
//   return n * factorial(n - 1);
// }
```

## More examples

For convenience, the package exports several handy functions demonstrating how you can use `almostmagic` to generate various types of data:
- [`babyNameIdeas`](https://losideadores.github.io/almostmagic2/functions/babyNameIdeas.html) generates a list of baby name ideas, optionally based on a user request, as an array of strings.
- [`businessIdeas`](https://losideadores.github.io/almostmagic2/functions/businessIdeas.html) generates a list of business ideas, optionally based on a user request, as an array of strings.
- [`generateArticleBasics`](https://losideadores.github.io/almostmagic2/functions/generateArticleBasics.html) generates an article’s title, intro, and outline, as an object with `title`, `intro`, and `outline` properties, each representing a string or (in the case of `outline`) an array of strings.
- [`getPostalCode`](https://losideadores.github.io/almostmagic2/functions/getPostalCode.html) tries to generate a postal code for a given location.
- [`randomAddressLine`](https://losideadores.github.io/almostmagic2/functions/randomAddressLine.html) generates a random address line, optionally for a given location.
- [`swotAnalysis`](https://losideadores.github.io/almostmagic2/functions/swotAnalysis.html) generates a SWOT analysis for a given idea, as an object with `strengths`, `weaknesses`, `opportunities`, and `threats` properties, each representing an array of strings.
- [`translate`](https://losideadores.github.io/almostmagic2/functions/translate.html) translates a given text from one language (doesn’t need specifying) to several other languages, as an object with keys corresponding to the requested target language codes and values corresponding to the translated text.

You can find the source code for each of these functions by following the links above and clicking the "Defined in" link in the bottom of the page.

## API reference

For complete documentation of every function, type, etc. exported by `almostmagic`, see the [API reference](https://losideadores.github.io/almostmagic2/modules.html).