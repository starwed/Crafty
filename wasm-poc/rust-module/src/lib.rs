#![feature(nll)]
use std::collections::HashSet; 
use std::mem;
use map::SpatialMap;
use map::CellManager;
mod map;
mod ray_traverser;


extern {
    fn logInt(number: i32);
    fn logFloat(number: f32);
    fn invoke_traversal_callback(callback_id: i32, entity_id: i32, set_number: i32) -> bool;
}

#[no_mangle]
pub extern "C" fn new_map() -> *mut map::GridSpatialMap {
    let b = Box::new(map::GridSpatialMap::new());
    return Box::into_raw(b)
}

#[no_mangle]
pub extern "C" fn get_result_buffer(capacity: usize) -> *mut i32 {
    let mut v = vec![0;capacity];
    let ptr = v.as_mut_ptr();
    mem::forget(v);
    return ptr as *mut i32;
}

#[no_mangle]
pub extern "C" fn update_map(
    map: *mut map::GridSpatialMap, 
    id: i32, x: f32, y:f32, w: f32, h: f32) {
    unsafe {
        (*map).update_map(id, x, y, w, h);
    }
}

#[no_mangle]
pub extern "C" fn remove_from_map(map: *mut map::GridSpatialMap, id: i32) {
    unsafe {
        (*map).remove(id);
    }
}

fn map_set_to_array(result_buffer: *mut i32, set: HashSet<i32>) -> isize {
    let mut i = 0;
    unsafe {
        for id in set {
            *result_buffer.offset(i) = id;
            i = i + 1;
        }
    }
    return i;
}

#[no_mangle]
pub extern "C" fn search(
    map: *mut map::GridSpatialMap, 
    result_buffer: *mut i32,
    x: f32, y:f32, w: f32, h: f32) -> usize {
    unsafe {
        let result_set = (*map).search( x, y, w, h);
        let l = result_set.len();
        map_set_to_array(result_buffer, result_set);
        return l;
    }
}

#[no_mangle]
pub extern "C" fn unfiltered_search(
    map: *mut map::GridSpatialMap, 
    result_buffer: *mut i32,
    x: f32, y:f32, w: f32, h: f32) -> usize {
    unsafe {
        let result_set = (*map).unfiltered_search( x, y, w, h);
        let l = result_set.len();
        map_set_to_array(result_buffer, result_set);
        return l;
    }
}

#[no_mangle]
pub extern "C" fn traverse_ray(
    map: *mut map::GridSpatialMap, 
    callback_id: i32,
    ox: f32, oy:f32, nx: f32, ny: f32,
    max_distance: f32) {

    unsafe {
        let mut traverser = (*map).traverse_ray(ox, oy, nx, ny, max_distance);

        // step through the traversal, running the callback on each result
        // Return either when the callback returns true, or the traversal is exhausted
        while let Some(traversal_result) = traverser.next() {
            if invoke_traversal_callback(callback_id, traversal_result.id, traversal_result.set_number) {
                logInt(10013);
                return;
            }
        }
        logInt(11717);
        return;
    }
}