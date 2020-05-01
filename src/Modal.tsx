import React, { Attributes, HTMLAttributes, ReactNode } from "react";

export type ModalProps = {
    title: string;
    children: ReactNode;
    onLeave?(): void;
    onClose?(): void;
} & HTMLAttributes<any>;

export const Modal = ({ title, children, onLeave, onClose, ...props }: ModalProps) => {
    return (
        <div className="backdrop" onClickCapture={ () => onLeave && onLeave() }>
            <div className="modal" { ...props }>
                <header className="modal__header">
                    <div className="modal__heading">{ title }</div>
                    <button className="modal__close" onClick={ () => onClose && onClose() }>&times;</button>
                </header>
                <div className="modal__body">{ children }</div>
            </div>
        </div>
    );
}

export default Modal;
