import {
	useForm,
	intent,
	getFormProps,
	getInputProps,
	getControlButtonProps,
	getFieldsetProps,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';

const taskSchema = z.object({
	content: z.string(),
	completed: z.boolean().optional(),
});

const todosSchema = z.object({
	title: z.string(),
	tasks: z.array(taskSchema).nonempty(),
});

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, {
		schema: todosSchema,
	});

	if (submission.status !== 'success') {
		return json(submission.reply());
	}

	return redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export default function Example() {
	const lastResult = useActionData<typeof action>();
	const { meta, fields } = useForm({
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: todosSchema });
		},
		shouldValidate: 'onBlur',
	});
	const tasks = fields.tasks.getFieldList();

	return (
		<Form method="post" {...getFormProps(meta)}>
			<div>
				<label>Title</label>
				<input
					className={!fields.title.valid ? 'error' : ''}
					{...getInputProps(fields.title)}
				/>
				<div>{fields.title.errors}</div>
			</div>
			<hr />
			<div className="form-error">{fields.tasks.errors}</div>
			{tasks.map((task, index) => {
				const taskFields = task.getFieldset();

				return (
					<fieldset key={task.key} {...getFieldsetProps(task)}>
						<div>
							<label>Task #${index + 1}</label>
							<input
								className={!taskFields.content.valid ? 'error' : ''}
								{...getInputProps(taskFields.content)}
							/>
							<div>{taskFields.content.errors}</div>
						</div>
						<div>
							<label>
								<span>Completed</span>
								<input
									className={!taskFields.completed.valid ? 'error' : ''}
									{...getInputProps(taskFields.completed, {
										type: 'checkbox',
									})}
								/>
							</label>
						</div>
						<button
							{...getControlButtonProps(
								meta.id,
								intent.remove({ name: fields.tasks.name, index }),
							)}
						>
							Delete
						</button>
						<button
							{...getControlButtonProps(
								meta.id,
								intent.reorder({ name: fields.tasks.name, from: index, to: 0 }),
							)}
						>
							Move to top
						</button>
						<button
							{...getControlButtonProps(
								meta.id,
								intent.replace({ name: task.name, value: { content: '' } }),
							)}
						>
							Clear
						</button>
					</fieldset>
				);
			})}
			<button
				{...getControlButtonProps(
					meta.id,
					intent.insert({ name: fields.tasks.name }),
				)}
			>
				Add task
			</button>
			<hr />
			<button>Save</button>
		</Form>
	);
}
