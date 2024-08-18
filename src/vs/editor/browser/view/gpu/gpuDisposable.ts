/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IDisposable } from 'vs/base/common/lifecycle';
import { isFunction } from 'vs/base/common/types';

export interface IDisposableGPUObject<T> extends IDisposable {
	value: T;
}

export namespace GPULifecycle {
	export async function requestDevice(descriptor: GPUDeviceDescriptor): Promise<IDisposableGPUObject<GPUDevice>> {
		if (!navigator.gpu) {
			throw new Error('This browser does not support WebGPU');
		}
		const adapter = (await navigator.gpu.requestAdapter())!;
		if (!adapter) {
			throw new Error('This browser supports WebGPU but it appears to be disabled');
		}
		return wrapDestroyableInDisposable(await adapter.requestDevice(descriptor));
	}

	export function createBuffer(device: GPUDevice, descriptor: GPUBufferDescriptor, initialValues?: Float32Array | (() => Float32Array)): IDisposableGPUObject<GPUBuffer> {
		const buffer = device.createBuffer(descriptor);
		if (initialValues) {
			device.queue.writeBuffer(buffer, 0, isFunction(initialValues) ? initialValues() : initialValues);
		}
		return wrapDestroyableInDisposable(buffer);
	}

	export function createTexture(device: GPUDevice, descriptor: GPUTextureDescriptor): IDisposableGPUObject<GPUTexture> {
		return wrapDestroyableInDisposable(device.createTexture(descriptor));
	}
}

function wrapDestroyableInDisposable<T extends { destroy(): void }>(value: T): IDisposableGPUObject<T> {
	return {
		value,
		dispose: () => value.destroy()
	};
}
